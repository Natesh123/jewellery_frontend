import { NavLink, useLocation } from 'react-router-dom';
import { sidebarItems } from '../../config/sidebarItems';
import './NavBar.css';
import { getIconComponent } from '../../utils/icons';
import { useState, useEffect, useRef } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { getPermissionsByRole } from '../../api/services/permissionService';
import { filterSidebarItems } from './sidebarService';

const Sidebar = ({ open, mobileOpen, onCloseMobile, onToggleSidebar }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [filteredSidebarItems, setFilteredSidebarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sidebarRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch permissions and filter sidebar items
  useEffect(() => {
    const initializeSidebar = async () => {
      try {
        setLoading(true);
        const roleId = localStorage.getItem('userRoleId');
        
        if (!roleId) {
          throw new Error('No role found in localStorage');
        }

        const permissions = await getPermissionsByRole(roleId);
        const filteredItems = filterSidebarItems(permissions.permissions);
        
        setFilteredSidebarItems(filteredItems);
        setError(null);
      } catch (err) {
        console.error('Error initializing sidebar:', err);
        setError(err.message);
        setFilteredSidebarItems([]);
      } finally {
        setLoading(false);
      }
    };

    initializeSidebar();
  }, []);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onCloseMobile();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileOpen, onCloseMobile]);

  // Auto-expand active parent items
  useEffect(() => {
    const expandActiveParents = () => {
      const newExpanded = {};
      
      const checkChildren = (items) => {
        items.forEach(item => {
          if (item.children) {
            const hasActiveChild = item.children.some(child => 
              location.pathname.startsWith(child.path) || checkChildren(child.children || [])
            );
            if (hasActiveChild) {
              newExpanded[item.path] = true;
            }
          }
        });
      };
      
      checkChildren(filteredSidebarItems);
      setExpandedItems(prev => ({ ...prev, ...newExpanded }));
    };

    expandActiveParents();
  }, [location.pathname, filteredSidebarItems]);

  const toggleExpand = (path) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const isItemActive = (item) => {
    if (item.path === location.pathname) return true;
    if (item.children) {
      return item.children.some(child => 
        location.pathname.startsWith(child.path) || 
        location.pathname === child.path ||
        isItemActive(child)
      );
    }
    return false;
  };

  const handleNavClick = (item) => {
    if (item.children) {
      toggleExpand(item.path);
    } else {
      if (isMobile && onCloseMobile) {
        onCloseMobile();
      }
    }
  };

  const handleChildClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavItem = (item, level = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems[item.path];
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <li key={item.path} className={`nav-item nav-parent level-${level} ${isActive ? 'active' : ''}`}>
          <div 
            className={`nav-link parent-link ${isActive ? 'active' : ''}`}
            onClick={() => handleNavClick(item)}
            onKeyDown={(e) => handleKeyDown(e, () => handleNavClick(item))}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            aria-haspopup="true"
          >
            <div className="link-content">
              <div className="icon-wrapper">
                {getIconComponent(item.icon)}
              </div>
              {(open || isMobile) && (
                <span className="link-text">{item.label}</span>
              )}
            </div>
            
            {(open || isMobile) && (
              <div className="expand-icon">
                {isExpanded ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
              </div>
            )}
            
            {!open && !isMobile && (
              <div className="tooltip">
                <span>{item.label}</span>
                {item.children && <small>{item.children.length} items</small>}
              </div>
            )}
          </div>
          
          <div className={`nav-children-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {((open || isMobile) && isExpanded) && (
              <ul className={`nav-children level-${level + 1}`}>
                {item.children.map(child => renderNavItem(child, level + 1))}
              </ul>
            )}
          </div>
        </li>
      );
    }

    return (
      <li key={item.path} className={`nav-item nav-child level-${level}`}>
        <NavLink 
          to={item.path}
          end={item.exact}
          onClick={handleChildClick}
          className={({ isActive }) => `nav-link child-link ${isActive ? 'active' : ''}`}
        >
          <div className="link-content">
            {level === 0 && (
              <div className="icon-wrapper">
                {getIconComponent(item.icon)}
              </div>
            )}
            {level > 0 && <div className="child-indicator" />}
            {(open || isMobile) && (
              <span className="link-text">{item.label}</span>
            )}
          </div>
          
          {!open && !isMobile && (
            <div className="tooltip">
              <span>{item.label}</span>
            </div>
          )}
        </NavLink>
      </li>
    );
  };

  const handleKeyDown = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`} 
        onClick={onCloseMobile} 
        aria-hidden="true"
      />
      
      <aside 
        ref={sidebarRef}
        className={`sidebar ${open ? 'expanded' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="sidebar-header">
          <div className="logo-section">
            {(open || isMobile) ? (
              <h3 className="sidebar-title">Amaya Gold Point</h3>
            ) : (
              <div className="sidebar-logo-mini" title="Amaya Gold">
                <span>AG</span>
              </div>
            )}
          </div>
          
          {!isMobile && onToggleSidebar && (
            <button 
              className="sidebar-toggle-btn"
              onClick={onToggleSidebar}
              aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
              title={open ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <ArrowRightIcon className={`toggle-icon ${open ? 'rotated' : ''}`} />
            </button>
          )}
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {loading ? (
              <li className="nav-item loading">Loading menu...</li>
            ) : error ? (
              <li className="nav-item error">Error: {error}</li>
            ) 
            : filteredSidebarItems.length > 0 ? (
              filteredSidebarItems.map(item => renderNavItem(item))
            ) 
            : (
              <li className="nav-item no-permissions">No menu items available</li>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;