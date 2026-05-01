const videoSrc = `${import.meta.env.BASE_URL}prompt-circumstance-hero.mp4`
const posterSrc = `${import.meta.env.BASE_URL}prompt-circumstance-hero-poster.jpg`

function FullWidthVideo({
  ariaLabel = 'Prompt and Circumstance video',
  className = '',
}) {
  const frameClassName = [
    'w-full overflow-hidden border-b border-rule bg-ink/5 shadow-[0_24px_70px_rgba(26,26,26,0.12)]',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={frameClassName}>
      <video
        aria-label={ariaLabel}
        autoPlay
        className="block aspect-[16/9] max-h-[56svh] min-h-[240px] w-full object-cover md:aspect-[16/7] lg:aspect-[16/6]"
        loop
        muted
        playsInline
        poster={posterSrc}
        preload="metadata"
        src={videoSrc}
      />
    </div>
  )
}

export default FullWidthVideo
