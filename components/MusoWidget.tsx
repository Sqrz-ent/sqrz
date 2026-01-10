type MusoProfile = {
  profile_url: string;
};

export default function MusoWidget({ profile }: { profile?: MusoProfile }) {
  if (!profile) return null;

  return (
    <div className="rounded-lg border p-4 bg-white shadow-sm">
      <div className="text-sm font-semibold text-gray-800 mb-1">
        🎵 Muso.ai Profile
      </div>

      <a
        href={profile.profile_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        View Full Muso Credits
      </a>
    </div>
  );
}
