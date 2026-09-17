export default function Icon({ name, className = '', fill = false, style = {} }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: fill ? "'FILL' 1" : undefined,
        ...style,
      }}
    >
      {name}
    </span>
  )
}
