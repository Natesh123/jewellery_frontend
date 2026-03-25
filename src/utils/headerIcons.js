import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

export const getHeaderIcon = (iconName) => {
  const iconMap = {
    menu: <MenuIcon className="header-icon" />,
    menu_open: <MenuOpenIcon className="header-icon" />,
    search: <SearchIcon className="header-icon" />,
    notifications: <NotificationsIcon className="header-icon" />,
    arrow_drop_up: <ArrowDropUpIcon className="header-icon" />,
    arrow_drop_down: <ArrowDropDownIcon className="header-icon" />,
    account_circle: <AccountCircleIcon className="header-icon" />,
    settings: <SettingsIcon className="header-icon" />,
    logout: <LogoutIcon className="header-icon" />
  };

  return iconMap[iconName] || <MenuIcon className="header-icon" />;
};