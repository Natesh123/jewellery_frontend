import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { headerMenuItems, headerUserData } from '../../config/headerConfig';
import { getHeaderIcon } from '../../utils/headerIcons';
import './Header.css';

const Header = ({ toggleSidebar, toggleMobileSidebar, sidebarOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const roleName = localStorage.getItem('userRole') || 'Admin';
  
  // Safely get and parse user data with multiple fallbacks
  let currUserData;
  try {
    const userData = localStorage.getItem('currUserData');
    currUserData = userData ? (typeof userData === 'string' ? JSON.parse(userData) : userData) : {};
  } catch (e) {
    console.error('Error parsing user data:', e);
    currUserData = {};
  }
  
  const username = currUserData?.username || headerUserData.name;
  const avatarText = currUserData?.username 
    ? currUserData.username.charAt(0).toUpperCase() 
    : headerUserData.avatarText;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuAction = (action) => {
    switch(action) {
      case 'logout':
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currUserData');
        navigate('/login');
        window.location.reload();
        break;
      case 'navigateToProfile':
        navigate('/profile');
        break;
      default:
        break;
    }
    setUserMenuOpen(false);
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <div className="header-left">
          <button 
            className="sidebar-toggle" 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? getHeaderIcon('menu_open') : getHeaderIcon('menu')}
          </button>
          <button 
            className="mobile-sidebar-toggle" 
            onClick={toggleMobileSidebar}
            aria-label="Toggle mobile sidebar"
          >
            {getHeaderIcon('menu')}
          </button>
        </div>
        
        <div className="header-right">
          <div className="header-actions">
            <div className="user-profile-wrapper">
              <div 
                className="user-profile-dropdown" 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="avatar">{avatarText}</div>
                <div className="user-info">
                  <div className="user-name">{username}</div>
                  <div className="user-role">{roleName}</div>
                </div>
                {userMenuOpen ? getHeaderIcon('arrow_drop_up') : getHeaderIcon('arrow_drop_down')}
              </div>
              
              {userMenuOpen && (
                <div className="dropdown-menu">
                  {headerMenuItems.map((item) => (
                    <button
                      key={item.id}
                      className="dropdown-item"
                      onClick={() => handleMenuAction(item.action)}
                    >
                      {getHeaderIcon(item.icon)}
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;