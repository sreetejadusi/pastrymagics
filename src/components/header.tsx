export default function Header() {
  return (
    <header className="relative z-10 w-full flex items-center justify-between p-2 h-12">
      <img
        src="/logo.png"
        alt="pastry-magiccs"
        className="h-12 w-auto py-2 px-6"
      />
      <nav className="flex items-center justify-center gap-6 text-black text-xs bg-background h-full px-6 backdrop-blur-3xl rounded-xl">
        <a href="#" className="opacity-70 hover:opacity-100 hover:underline transition-colors">
          Order
        </a>
        <a href="#" className="opacity-70 hover:opacity-100 hover:underline transition-colors">
          Customise
        </a>
        <a href="#" className="opacity-70 hover:opacity-100 hover:underline transition-colors">
          Menu
        </a>
        <a href="#" className="opacity-70 hover:opacity-100 hover:underline transition-colors">
          Contact
        </a>
      </nav>
    </header>
  );
}
