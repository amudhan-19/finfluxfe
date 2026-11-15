import { LicenseInfo } from '@mui/x-license'

const key = import.meta.env.VITE_MUI_X_LICENSE_KEY as string | undefined

if (key?.trim()) {
  LicenseInfo.setLicenseKey(key.trim())
}
