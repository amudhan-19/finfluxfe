// @author  veera
// @file    pages/admin/ConfigPage.tsx

import { useState } from 'react'
import { Building2, ImageIcon, Settings2, Shield, SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { BrandingCard } from '@/features/admin-config/components/BrandingCard'
import { ConfigCollapsible } from '@/features/admin-config/components/ConfigCollapsible'
import { EntitiesAdminCard } from '@/features/admin-config/components/EntitiesAdminCard'
import { ModuleAccessCard } from '@/features/admin-config/components/ModuleAccessCard'
import { PermissionMatrixCard } from '@/features/admin-config/components/PermissionMatrixCard'

type OpenKey = 'modules' | 'perms' | 'entities' | 'branding'

export default function ConfigPage() {
  const [open, setOpen] = useState<Record<OpenKey, boolean>>({
    modules: true,
    perms: false,
    entities: false,
    branding: false,
  })
  const toggle = (k: OpenKey) => setOpen((s) => ({ ...s, [k]: !s[k] }))

  return (
    <div className="admin-config-page">
      <PageHeader
        title="Configuration"
        subtitle="Module access by role, granular permissions, legal entities, and branding"
        icon={<Settings2 size={22} strokeWidth={2} />}
      />

      <ConfigCollapsible
        title="Module Access by Role"
        subtitle="Which top-level modules each role can open. Admin always has full access."
        icon={SlidersHorizontal}
        open={open.modules}
        onToggle={() => toggle('modules')}
      >
        <ModuleAccessCard />
      </ConfigCollapsible>

      <ConfigCollapsible
        title="Granular Permissions Matrix"
        subtitle="Permission groups inside each module. Admin role is locked on."
        icon={Shield}
        open={open.perms}
        onToggle={() => toggle('perms')}
      >
        <PermissionMatrixCard />
      </ConfigCollapsible>

      <ConfigCollapsible
        title="Legal Entities"
        subtitle="Entity registry: code, currency, fiscal year-end, tax ID, supervisor."
        icon={Building2}
        open={open.entities}
        onToggle={() => toggle('entities')}
      >
        <EntitiesAdminCard />
      </ConfigCollapsible>

      <ConfigCollapsible
        title="Branding & logo"
        subtitle="Upload client logo and set the primary brand color."
        icon={ImageIcon}
        open={open.branding}
        onToggle={() => toggle('branding')}
      >
        <BrandingCard />
      </ConfigCollapsible>
    </div>
  )
}
