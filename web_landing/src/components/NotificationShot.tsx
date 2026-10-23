// Crops the phone wallpaper out of the 1179px-wide notification screenshots.
const CROP_X = 50
const CROP_WIDTH = 1081

type NotificationShotProps = {
  src: string
  alt: string
  cropTop: number
  cropHeight: number
  className: string
}

function NotificationShot({ src, alt, cropTop, cropHeight, className }: NotificationShotProps) {
  return (
    <div
      className={`overflow-hidden shadow-card ${className}`}
      style={{ aspectRatio: `${CROP_WIDTH} / ${cropHeight}` }}
    >
      <img
        src={src}
        alt={alt}
        className="max-w-none"
        style={{
          width: `${(1179 / CROP_WIDTH) * 100}%`,
          marginLeft: `${(-CROP_X / CROP_WIDTH) * 100}%`,
          marginTop: `${(-cropTop / CROP_WIDTH) * 100}%`,
        }}
      />
    </div>
  )
}

export default NotificationShot
