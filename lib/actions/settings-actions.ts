"use server"

export type StoreInfo = {
  name: string
  address: string
  phone: string
  email: string
}

// Default store info for AQSS Flow Limited
export async function getStoreSettings(): Promise<StoreInfo> {
  return {
    name: "AQSS Flow Limited",
    address: "Eastleigh, Nairobi, Kenya",
    phone: "+254 799 964 646",
    email: "aqssflow@gmail.com",
  }
}

// Stub function that just returns success without doing anything
export async function updateStoreSetting(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Setting update requested but disabled: ${key} = ${value}`)
  return { success: true }
}
