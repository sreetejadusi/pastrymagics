import Header from "@/components/header";

export default function Home() {
  return (
    <main className="">
      <svg width="0" height="0">
        <defs>
          <clipPath id="curvedClip" clipPathUnits="objectBoundingBox">
            {/* Modified path: straight top, curved bottom */}
            <path d="M0,0 H1 V0.85 C0.7,0.95 0.3,0.95 0,0.85 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="h-screen flex relative flex-col items-center justify-center overflow-hidden">
        {/* Background with curved top & bottom */}
        <div className="absolute inset-0 -z-10">
          <div className="relative w-full h-full overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                clipPath: "url(#curvedClip)", // Reference the SVG clipPath here
                backgroundColor: "#f9d5df", // fallback color
              }}
            >
              <video
                src="/cake.mp4"
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
            {/* Optional dark overlay - also apply the curved clip path */}
            <div
              className="absolute inset-0 bg-black opacity-40"
              style={{
                clipPath: "url(#curvedClip)", // Reference the SVG clipPath here as well
              }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-background text-6xl md:text-8xl text-center z-10">
          Baked with Love, <br />
          Sprinkled with Magic.
        </h1>
        <div className="flex gap-4 mt-8 z-10 text-foreground">
          <button className="px-4 py-2 bg-background rounded-md text-sm button-one">
            Order at the Table
          </button>
          <button className="px-4 py-2 bg-background rounded-md text-sm button-one">
            Customise a Cake
          </button>
        </div>
      </div>
    </main>
  );
}
