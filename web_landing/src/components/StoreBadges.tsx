import appStoreBadge from '../assets/badges/app-store.png'
import googlePlayBadge from '../assets/badges/google-play.png'

// TODO: replace with the real store listings once the app is published.
const APP_STORE_URL = '#'
const GOOGLE_PLAY_URL = '#'

function StoreBadges() {
  return (
    <div className="flex flex-wrap gap-3.5">
      <a href={APP_STORE_URL} aria-label="Download on the App Store">
        <img src={appStoreBadge} alt="" width={180} height={53} className="h-[46px] w-[156px] sm:h-[53px] sm:w-[180px]" />
      </a>
      <a href={GOOGLE_PLAY_URL} aria-label="Get it on Google Play">
        <img src={googlePlayBadge} alt="" width={180} height={53} className="h-[46px] w-[156px] sm:h-[53px] sm:w-[180px] object-cover" />
      </a>
    </div>
  )
}

export default StoreBadges
