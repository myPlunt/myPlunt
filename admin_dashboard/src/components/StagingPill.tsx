const isStaging = import.meta.env.VITE_APP_VARIANT === 'staging'

// Shown by the logo so admins can tell the staging dashboard from production.
// Renders nothing outside the staging build.
function StagingPill() {
  if (!isStaging) {
    return null
  }
  return (
    <span className="self-center rounded-full bg-staging px-2 py-0.5 text-xs font-semibold tracking-wider text-charcoal">
      STAGING
    </span>
  )
}

export default StagingPill
