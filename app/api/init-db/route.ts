import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("API: Starting database initialization...")
    const supabase = getSupabaseServerClient()

    if (!supabase) {
      console.error("API: Failed to initialize Supabase client")
      return NextResponse.json({ success: false, error: "Failed to initialize database client" }, { status: 500 })
    }

    // 1. Create settings table if it doesn't exist
    console.log("API: Creating settings table if it doesn't exist...")
    try {
      const { error: createTableError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) NOT NULL UNIQUE,
            value TEXT,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (createTableError) {
        console.error("API: Error creating settings table:", createTableError)
        return NextResponse.json(
          { success: false, error: `Error creating settings table: ${createTableError.message}` },
          { status: 500 },
        )
      }
    } catch (error) {
      console.error("API: Exception creating settings table:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Exception creating settings table: ${error instanceof Error ? error.message : String(error)}`,
        },
        { status: 500 },
      )
    }

    // 2. Insert default settings directly with SQL to avoid permission issues
    console.log("API: Inserting default settings...")
    try {
      const { error: insertError } = await supabase.rpc("execute_sql", {
        sql_query: `
          INSERT INTO settings (key, value, description, created_at, updated_at)
          VALUES 
          ('store_name', 'AQSS Flow Limited', 'Store name setting', NOW(), NOW()),
          ('store_address', 'Eastleigh, Nairobi, Kenya', 'Store address setting', NOW(), NOW()),
          ('store_phone', '+254 799 964 646', 'Store phone setting', NOW(), NOW()),
          ('store_email', 'aqssflow@gmail.com', 'Store email setting', NOW(), NOW())
          ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value, updated_at = NOW()
          WHERE settings.value LIKE '%VendaFlow%' 
             OR settings.value LIKE '%123 Main%' 
             OR settings.value LIKE '%My Store%' 
             OR settings.value LIKE '%Your Street%' 
             OR settings.value LIKE '%example.com%';
        `,
      })

      if (insertError) {
        console.error("API: Error inserting default settings:", insertError)
        return NextResponse.json(
          { success: false, error: `Error inserting default settings: ${insertError.message}` },
          { status: 500 },
        )
      }
    } catch (error) {
      console.error("API: Exception inserting default settings:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Exception inserting default settings: ${error instanceof Error ? error.message : String(error)}`,
        },
        { status: 500 },
      )
    }

    // 3. Add customer_name column to sales table if it doesn't exist
    console.log("API: Adding customer_name column to sales table if needed...")
    try {
      const { error: alterTableError } = await supabase.rpc("execute_sql", {
        sql_query: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'sales' 
              AND column_name = 'customer_name'
            ) THEN
              ALTER TABLE sales ADD COLUMN customer_name TEXT;
            END IF;
          END $$;
        `,
      })

      if (alterTableError) {
        console.error("API: Error adding customer_name column:", alterTableError)
        return NextResponse.json(
          { success: false, error: `Error adding customer_name column: ${alterTableError.message}` },
          { status: 500 },
        )
      }
    } catch (error) {
      console.error("API: Exception adding customer_name column:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Exception adding customer_name column: ${error instanceof Error ? error.message : String(error)}`,
        },
        { status: 500 },
      )
    }

    // 4. Add payment columns to purchases table if they don't exist
    console.log("API: Adding payment columns to purchases table if needed...")
    try {
      const { error: alterPurchasesError } = await supabase.rpc("execute_sql", {
        sql_query: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'purchases' 
              AND column_name = 'payment_status'
            ) THEN
              ALTER TABLE purchases ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Paid';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'purchases' 
              AND column_name = 'payment_method'
            ) THEN
              ALTER TABLE purchases ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'purchases' 
              AND column_name = 'amount_paid'
            ) THEN
              ALTER TABLE purchases ADD COLUMN amount_paid NUMERIC DEFAULT NULL;
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'purchases' 
              AND column_name = 'amount_due'
            ) THEN
              ALTER TABLE purchases ADD COLUMN amount_due NUMERIC DEFAULT 0;
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'purchases' 
              AND column_name = 'agreement_terms'
            ) THEN
              ALTER TABLE purchases ADD COLUMN agreement_terms TEXT DEFAULT NULL;
            END IF;
          END $$;

          -- Fix unpaid / credit / agreement purchases
          UPDATE purchases 
          SET 
            amount_paid = 0,
            amount_due = total_amount
          WHERE (
            LOWER(COALESCE(payment_status, '')) LIKE '%unpaid%' 
            OR LOWER(COALESCE(payment_status, '')) LIKE '%credit%' 
            OR LOWER(COALESCE(payment_status, '')) LIKE '%agree%'
          ) AND (amount_due IS NULL OR amount_due = 0 OR amount_paid = total_amount);

          -- Fix fully paid purchases
          UPDATE purchases 
          SET 
            payment_status = 'Paid',
            amount_paid = total_amount,
            amount_due = 0
          WHERE (
            payment_status IS NULL 
            OR payment_status = '' 
            OR LOWER(payment_status) = 'paid' 
            OR LOWER(payment_status) = 'fully paid'
          ) AND (amount_paid IS NULL OR amount_due IS NULL OR amount_due > 0);
        `,
      })

      if (alterPurchasesError) {
        console.error("API: Error updating purchases table:", alterPurchasesError)
      }
    } catch (error) {
      console.error("API: Exception updating purchases table:", error)
    }

    console.log("API: Database initialization completed successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API: Unhandled error in init-db route:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
