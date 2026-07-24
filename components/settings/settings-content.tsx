"use client"

import { StoreSettings } from "./store-settings"
import { SettingsList } from "./settings-list"
import { SettingsDataProvider } from "./settings-data-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store, Sliders } from "lucide-react"

export function SettingsContent() {
  return (
    <SettingsDataProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your store information, receipt header details, and system configuration.
          </p>
        </div>

        <Tabs defaultValue="store" className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store & Receipt Info
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              System Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-4">
            <StoreSettings />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <SettingsList />
          </TabsContent>
        </Tabs>
      </div>
    </SettingsDataProvider>
  )
}
