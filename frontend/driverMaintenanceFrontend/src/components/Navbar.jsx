// Navbar Component
const Navbar = ({ title }) => {
  return (
    <nav className="navbar">
      <h1>{title || 'Driver & Bus Maintenance'}</h1>
    </nav>
  )
}

export default Navbar
