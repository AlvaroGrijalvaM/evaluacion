import { useEffect, useState } from "react";

export default function AuthImage({ src, alt, className }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("token");
    fetch(src, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (active && blob) setBlobUrl(URL.createObjectURL(blob));
      });
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (!blobUrl) return <div className={`bg-gray-100 ${className}`} />;
  return <img src={blobUrl} alt={alt} className={className} />;
}
