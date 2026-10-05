// TODO: Phone frame is empty, when app is created change the screen prop to the app screenshot

const sizes = {
  lg: { frame: 'h-[597px] w-[290px] rounded-[44px]', screen: 'rounded-[35px]', island: 'w-[87px]' },
  md: { frame: 'h-[515px] w-[250px] rounded-[38px]', screen: 'rounded-[30px]', island: 'w-[75px]' },
}

type PhoneMockupProps = {
  size?: keyof typeof sizes
  screen?: string
  className?: string
}

function PhoneMockup({ size = 'lg', screen, className = '' }: PhoneMockupProps) {
  const s = sizes[size]

  return (
    <div className={`flex flex-col bg-charcoal p-2.5 shadow-phone ${s.frame} ${className}`}>
      <div className={`relative flex-1 overflow-hidden bg-white ${s.screen}`}>
        {screen && <img src={screen} alt="" className="size-full object-cover" />}
        <div
          className={`absolute top-3 left-1/2 h-[22px] -translate-x-1/2 rounded-[11px] bg-charcoal ${s.island}`}
        />
      </div>
    </div>
  )
}

export default PhoneMockup
