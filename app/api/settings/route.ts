import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

function isPlaceholder(val?: string | null): boolean {
  if (!val) return true
  const s = val.trim().toLowerCase()
  if (!s) return true
  return (
    s === "my store" ||
    s === "vendaflow pos" ||
    s === "vendaflow" ||
    s === "store name" ||
    s.includes("123 your street") ||
    s.includes("your city") ||
    s.includes("123 main street") ||
    s.includes("city, country") ||
    s.includes("store@example.com") ||
    s.includes("info@vendaflow.com") ||
    s.includes("700 000 000") ||
    s.includes("234 567 890")
  )
}

function cleanPrefix(val: string, prefixRegex: RegExp): string {
  return val.replace(prefixRegex, "").trim()
}

export async function GET() {
  try {
    // Default store info
    const defaultStoreInfo = {
      name: "AQSS Flow Limited",
      address: "Eastleigh, Nairobi, Kenya",
      phone: "+254 799 964 646",
      email: "aqssflow@gmail.com",
    }

    // Get the server client with service role key
    const supabase = getSupabaseServerClient()
    if (!supabase) {
      console.error("API: Failed to initialize Supabase client")
      return NextResponse.json(defaultStoreInfo)
    }

    try {
      // Try to fetch settings from the database
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .in("key", ["store_name", "store_address", "store_phone", "store_email"])

      if (error) {
        console.error("API: Error fetching settings:", error)
        return NextResponse.json(defaultStoreInfo)
      }

      const rawName = data?.find((s) => s.key === "store_name")?.value
      const rawAddress = data?.find((s) => s.key === "store_address")?.value
      let rawPhone = data?.find((s) => s.key === "store_phone")?.value
      let rawEmail = data?.find((s) => s.key === "store_email")?.value

      if (rawPhone) rawPhone = cleanPrefix(rawPhone, /^(phone|tel|mobile):\s*/i)
      if (rawEmail) rawEmail = cleanPrefix(rawEmail, /^(email|mail):\s*/i)

      const storeInfo = {
        name: rawName && !isPlaceholder(rawName) ? rawName : defaultStoreInfo.name,
        address: rawAddress && !isPlaceholder(rawAddress) ? rawAddress : defaultStoreInfo.address,
        phone: rawPhone && !isPlaceholder(rawPhone) ? rawPhone : defaultStoreInfo.phone,
        email: rawEmail && !isPlaceholder(rawEmail) ? rawEmail : defaultStoreInfo.email,
      }

      return NextResponse.json(storeInfo)
    } catch (fetchError) {
      console.error("API: Exception fetching settings:", fetchError)
      return NextResponse.json(defaultStoreInfo)
    }
  } catch (error) {
    console.error("API: Error in settings route:", error)
    return NextResponse.json(
      {
        name: "AQSS Flow Limited",
        address: "Eastleigh, Nairobi, Kenya",
        phone: "+254 799 964 646",
        email: "aqssflow@gmail.com",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "Missing key or value" }, { status: 400 })
    }

    // Get the server client with service role key
    const supabase = getSupabaseServerClient()
    if (!supabase) {
      console.error("API: Failed to initialize Supabase client")
      return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 })
    }

    // Check if setting exists
    const { data, error: fetchError } = await supabase.from("settings").select("*").eq("key", key).maybeSingle()

    if (fetchError) {
      console.error(`API: Error checking if setting ${key} exists:`, fetchError)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    if (data) {
      // Update existing setting
      const { error: updateError } = await supabase
        .from("settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key)

      if (updateError) {
        console.error(`API: Error updating setting ${key}:`, updateError)
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
      }
    } else {
      // Create new setting
      const { error: insertError } = await supabase.from("settings").insert({
        key,
        value,
        description: `Store ${key.replace("store_", "")} setting`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error(`API: Error inserting setting ${key}:`, insertError)
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API: Error in settings POST route:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
