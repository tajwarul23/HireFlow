import Hero from "./Hero";

// The Footer is rendered by MainLayout for every page, so it isn't added here.
const HomePage = () => {
  return (
    <div className="relative min-h-screen max-w-7xl mx-auto overflow-x-hidden">
      <Hero />
    </div>
  );
};

export default HomePage;
