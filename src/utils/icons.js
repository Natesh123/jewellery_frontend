import DashboardIcon from '@mui/icons-material/Dashboard';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/HelpOutline';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import BusinessIcon from '@mui/icons-material/Business';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BalanceIcon from '@mui/icons-material/Balance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DiamondIcon from '@mui/icons-material/Diamond';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';


export const getIconComponent = (iconName) => {
  const iconMap = {
    dashboard: <DashboardIcon className="nav-icon" />,
    analytics: <AnalyticsIcon className="nav-icon" />,
    people: <PeopleIcon className="nav-icon" />,
    inventory_2: <InventoryIcon className="nav-icon" />,
    receipt_long: <ReceiptIcon className="nav-icon" />,
    assessment: <AssessmentIcon className="nav-icon" />,
    settings: <SettingsIcon className="nav-icon" />,
    help_outline: <HelpIcon className="nav-icon" />,
    payments: <CurrencyRupeeIcon className="nav-icon" />,
    company : <BusinessIcon className="nav-icon" />,
    customer : <GroupAddIcon className="nav-icon" />,
    purchase : <ShoppingCartIcon className="nav-icon" />,
    sales : <BalanceIcon className="nav-icon" />,
    report : <ReceiptLongIcon className="nav-icon" />,
    metal:<DiamondIcon className="nav-icon" />,
    purity:<HowToRegIcon className="nav-icon" />,
    bank:<AccountBalanceIcon className="nav-icon" />,
    quotation : <SpeakerNotesIcon className="nav-icon" />,
    pledge : <PersonPinCircleIcon className="nav-icon" />,
    branches: <AddBusinessIcon className="nav-icon" />,
    
  };

  return iconMap[iconName] || <DashboardIcon className="nav-icon" />;
};