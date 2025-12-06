"use client";

interface AvatarProps {
  photoUrl?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export default function Avatar({
  photoUrl,
  gender,
  name,
  size = "md",
  className = "",
}: AvatarProps) {
  const sizeClass = sizeClasses[size];

  // Si hay foto, mostrarla
  if (photoUrl) {
    return (
      <div 
        className={`${sizeClass} ${className} rounded-full overflow-hidden`} 
        style={{ 
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'inline-block'
        }}
      >
        <img
          src={photoUrl}
          alt={name}
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block'
          }}
          onError={(e) => {
            // Si la imagen falla, mostrar avatar por defecto
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              const fallback = parent.querySelector(".avatar-fallback") as HTMLElement;
              if (fallback) fallback.style.display = "block";
            }
          }}
        />
        <div className="avatar-fallback hidden">
          {getDefaultAvatar(gender, sizeClass, className)}
        </div>
      </div>
    );
  }

  // Si no hay foto, mostrar avatar por defecto según género
  return getDefaultAvatar(gender, sizeClass, className);
}

function getDefaultAvatar(
  gender: "MALE" | "FEMALE" | "OTHER" | null | undefined,
  sizeClass: string,
  className: string
): JSX.Element {
  // Si no hay género o es OTHER, usar avatar masculino por defecto
  const avatarPath =
    gender === "FEMALE"
      ? "/avatars/avatar-F.svg"
      : "/avatars/avatar-M.svg";

  return (
    <div 
      className={`${sizeClass} ${className} relative rounded-full overflow-hidden bg-gray-200`} 
      style={{ 
        aspectRatio: '1/1',
        position: 'relative',
        display: 'inline-block'
      }}
    >
      <img
        src={avatarPath}
        alt="Avatar"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ 
          objectFit: 'contain',
          objectPosition: 'center',
          padding: '12%',
          borderRadius: '50%'
        }}
      />
    </div>
  );
}

