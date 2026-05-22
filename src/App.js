import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Preloader from './Components/Preloader/Preloader';
import Login from './Pages/Login/Login';
import Dashboard from './Pages/Dashboard/Dashboard';
import Sidebar from './Components/NavBar/Navbar';
import Header from './Components/Header/Header';
import Company_creation from './Pages/Company_creation/Company_creation';
import User_creation from './Pages/User_creation/User_creation'
import Metal from './Pages/Metal/Metal';
import Purity from './Pages/Purity/Purity';
import Category from './Pages/Items/Category/Category';
import Product from './Pages/Items/Products/Product';
import SubProduct from './Pages/Items/SubProduct/SubProduct';
import Customer_creation from './Pages/Customer_creation/Customer_creation';
import Cus_bank_creation from './Pages/Cus_bank_creation/Cus_bank_creation';
import Purchase from './Pages/Purchase/Purchase';
import Customer_quotation from './Pages/Customer_quotation/Customer_quotation';
import PledgeItems from './Pages/PledgeItems/PledgeItems';
import PledgeManager from './Pages/PledgeItems/pledegeManager';
import MoneyRequest from './Pages/PledgeItems/MoneyRequest';
import PledgeSalesExecutive from './Pages/PledgeItems/PledgeSalesExecutive';
import Branches from './Pages/Branches/Branches';
import Roles from './Pages/User_creation/Roles/Roles';
import Permissions from './Pages/User_creation/Permissions/Permissions';
import Receipt from './Pages/Receipt/Receipt';
import Sales from './Pages/Sales/Sales';
import SalesReceipt from './Pages/Sales/SalesReceipt';
import Reports from './Pages/Reports/Reports';

import Collections from './Pages/PledgeItems/Collection'
import BankCollection from './Pages/PledgeItems/BankCollection'
import FinanceInstitute from './Pages/PledgeItems/FinanceInstitute';
import GoldCollect from './Pages/PledgeItems/GoldCollect';
import ManagerApproval from './Pages/PledgeItems/ManagerApproval';
import ReligionalManager from './Pages/PledgeItems/Religional_manager';
import AccountsApproval from './Pages/PledgeItems/AccountsApproval';
import PledgeManagerSalesExecutive from './Pages/PledgeItems/PledgeManagerSalesExecutive';
import PledgeManageApproval from './Pages/PledgeItems/PledgeManageApproval';
import MCXRate from './Pages/MCXRate/MCXRate';
import AllPledges from './Pages/PledgeItems/AllPledges';
import PledgeQuotation from './Pages/PledgeQuotation/PledgeQuotation';
import MetalLiveRate from './Pages/MCXRate/MetalLiveRate';
import RegionalPurchaseCheck from './Pages/Purchase/RegionalPurchaseCheck';
import AccountsPurchaseCheck from './Pages/Purchase/AccountsPurchaseCheck';
import MeltingPurchase from './Pages/Purchase/MeltingPurchase';
import MeltingStatus from './Pages/Purchase/Melting';
import MasterGrouping from './Pages/Accounts/MasterGrouping';
import AccountHead from './Pages/Accounts/AccountHead';
import AccountReceipt from './Pages/Accounts/AccountsReceipt';
import OpeningBalance from './Pages/Accounts/OpeningBalance';
import OpeningStock from './Pages/Accounts/OpeningStock';
import State from './Pages/Accounts/State';
import GoldRateUpdate from './Pages/Settings/GoldRateUpdate';
import MarginSettings from './Pages/Settings/MarginSettings';
import MeltingReceipt from './Pages/Purchase/MeltingReceipt';



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    const timer = setTimeout(() => {
      const token = localStorage.getItem('adminToken');
      setIsAuthenticated(!!token);
      // setIsAuthenticated(true)
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  if (loading) {
    return <Preloader />;
  }

  return (
    <Router>
      <div className={`app-container ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {isAuthenticated && (
          <>
            <Header
              toggleSidebar={toggleSidebar}
              toggleMobileSidebar={toggleMobileSidebar}
              sidebarOpen={sidebarOpen}
            />
            <Sidebar
              open={sidebarOpen}
              mobileOpen={mobileSidebarOpen}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </>
        )}

        <main className={`main-content ${isAuthenticated ? 'authenticated' : ''}`}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/company_creation"
              element={
                isAuthenticated ? <Company_creation /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/branches"
              element={
                isAuthenticated ? <Branches /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/user-creation"
              element={
                isAuthenticated ? <User_creation /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/roles"
              element={
                isAuthenticated ? <Roles /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/permissions"
              element={
                isAuthenticated ? <Permissions /> : <Navigate to="/login" replace />
              }
            />


            <Route
              path="/metals"
              element={
                isAuthenticated ? <Metal /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/mcx_rate"
              element={
                isAuthenticated ? <MCXRate /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/purity"
              element={
                isAuthenticated ? <Purity /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="items/category"
              element={
                isAuthenticated ? <Category /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="items/products"
              element={
                isAuthenticated ? <Product /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="items/subproducts"
              element={
                isAuthenticated ? <SubProduct /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="customer_creation"
              element={
                isAuthenticated ? <Customer_creation /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="all_pledges"
              element={
                isAuthenticated ? <AllPledges /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="customer_bank_creation"
              element={
                isAuthenticated ? <Cus_bank_creation /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="customer_quotation"
              element={
                isAuthenticated ? <Customer_quotation /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="purchase"
              element={
                isAuthenticated ? <Purchase /> : <Navigate to="/login" replace />
              }
            />

            <Route path="/receipt/:purchaseId"
              element={
                isAuthenticated ? <Receipt /> : <Navigate to="/login" replace />
              }
            />
            <Route path="/sales-receipt/:meltId"
              element={
                isAuthenticated ? <SalesReceipt /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="pledege_items"
              element={
                isAuthenticated ? <PledgeItems /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="collection"
              element={
                isAuthenticated ? <Collections /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="bank_collection"
              element={
                isAuthenticated ? <BankCollection /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="finance_institute"
              element={
                isAuthenticated ? <FinanceInstitute /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="religional_manager"
              element={
                isAuthenticated ? <ReligionalManager /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="accounts_approval"
              element={
                isAuthenticated ? <AccountsApproval /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="gold_collect"
              element={
                isAuthenticated ? <GoldCollect /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="pledge_quotation"
              element={
                isAuthenticated ? <PledgeQuotation /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="metal_live_rate"
              element={
                isAuthenticated ? <MetalLiveRate /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="manager_approval"
              element={
                isAuthenticated ? <ManagerApproval /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="regional_manager_purchase_approval"
              element={
                isAuthenticated ? <RegionalPurchaseCheck /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="accounts_purchase_approval"
              element={
                isAuthenticated ? <AccountsPurchaseCheck /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="melting_purchase"
              element={
                isAuthenticated ? <MeltingPurchase /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="melting_status"
              element={
                isAuthenticated ? <MeltingStatus /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="melting_receipt"
              element={
                isAuthenticated ? <MeltingReceipt /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="master_grouping"
              element={
                isAuthenticated ? <MasterGrouping /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="account_head"
              element={
                isAuthenticated ? <AccountHead /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="account_receipt"
              element={
                isAuthenticated ? <AccountReceipt /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="opening_balance"
              element={
                isAuthenticated ? <OpeningBalance /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="opening_stock"
              element={
                isAuthenticated ? <OpeningStock /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="state"
              element={
                isAuthenticated ? <State /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="pledge_manager_approval"
              element={
                isAuthenticated ? <PledgeManageApproval /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="sales"
              element={
                isAuthenticated ? <Sales /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="reports"
              element={
                isAuthenticated ? <Reports /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="pledege_item_manager"
              element={
                isAuthenticated ? <PledgeManagerSalesExecutive /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="pledege_zone_manager"
              element={
                isAuthenticated ? <PledgeManager /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="pledege_sales_executive"
              element={
                isAuthenticated ? <PledgeSalesExecutive /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="money_request"
              element={
                isAuthenticated ? <MoneyRequest /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="fix_today_rate"
              element={
                isAuthenticated ? <GoldRateUpdate /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="margin_settings"
              element={
                isAuthenticated ? <MarginSettings /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login setIsAuthenticated={setIsAuthenticated} />
              }
            />
            <Route
              path="*"
              element={
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;