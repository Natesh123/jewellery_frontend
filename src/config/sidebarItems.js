export const sidebarItems = [
  {
    path: '/dashboard',
    icon: 'dashboard',
    label: 'Dashboard',
    exact: true,
    permission: 'dashboard'
  },
  {
    path: '/company_creation',
    icon: 'company',
    label: 'Company Creation',
    exact: true,
    permission: 'company_creation'
  },
  {
    path: '/branches',
    icon: 'branches',
    label: 'Branch Registration',
    exact: true,
    permission: 'branches'
  },
  {
    path: '/users',
    icon: 'people',
    label: 'Users',
    permission: 'users:user-creation',
    children: [
      {
        path: '/roles',
        label: 'Roles',
        permission: 'users:roles'
      },
      {
        path: '/permissions',
        label: 'Permissions',
        permission: 'users:permissions'
      },
      {
        path: '/user-creation',
        label: 'User Creation',
        permission: 'users:user-creation'
      }
    ]
  },
  {
    path: '/purity',
    icon: 'purity',
    label: 'Purity',
    exact: true,
    permission: 'purity'
  },
  {
    path: '/metals',
    icon: 'metal',
    label: 'Metals',
    exact: true,
    permission: 'metals'
  },
  {
    path: '/state',
    icon: 'location',
    label: 'State',
    exact: true,
    permission: 'state'
  },
  {
    path: '/items',
    icon: 'analytics',
    label: 'Items',
    permission: 'items:items:category',
    children: [
      {
        path: '/items/category',
        label: 'Category',
        permission: 'items:items:category'
      },
      {
        path: '/items/products',
        label: 'Products',
        permission: 'items:items:products'
      },
      {
        path: '/items/subproducts',
        label: 'Sub Products',
        permission: 'items:items:subproducts'
      }
    ]
  },
  {
    path: '/customer_creation',
    icon: 'customer',
    label: 'Customer Registration',
    exact: true,
    permission: 'customer_creation'
  },
  {
    path: '/customer_bank_creation',
    icon: 'bank',
    label: 'Customer Bank Creation',
    exact: true,
    permission: 'customer_bank_creation'
  },
  {
    path: '/customer_quotation',
    icon: 'quotation',
    label: 'Customer Quotation',
    exact: true,
    permission: 'customer_quotation'
  },
  {
    path: '/pledege_items',
    icon: 'pledge',
    label: 'Pledge Items',
    exact: true,
    permission: 'pledege_items'
  },
  {
    path: '/pledge_quotation',
    icon: 'quotation',
    label: 'Pledge Quotation',
    exact: true,
    permission: 'pledge_quotation'
  },
  {
    path: '/all_pledges',
    icon: 'pledge',
    label: 'All Pledges',
    exact: true,
    permission: 'all_pledges'
  },
  {
    path: '/purchase',
    icon: 'purchase',
    label: 'Purchase',
    exact: true,
    permission: 'purchase'
  },
  {
    path: '/metal_live_rate',
    icon: 'metal',
    label: 'Metal Live Rate',
    exact: true,
    permission: 'metal_live_rate'
  },
  {
    path: '/mcx_rate',
    icon: 'metal',
    label: 'MCX Rate',
    exact: true,
    permission: 'mcx_rate'
  },
  {
    path: '/pledege_item_manager',
    icon: 'pledge',
    label: 'Pledge Item Approval',
    exact: true,
    permission: 'pledege_item_manager'
  },
  {
    path: '/pledege_zone_manager',
    icon: 'pledge',
    label: 'Pledge Assign Executive',
    exact: true,
    permission: 'pledege_zone_manager'
  },
  {
    path: '/pledege_sales_executive',
    icon: 'pledge',
    label: 'Money Request(Pledge Item Sales Executive)',
    exact: true,
    permission: 'pledege_sales_executive'
  },
  {
    path: '/money_request',
    icon: 'pledge',
    label: 'Money Request',
    exact: true,
    permission: 'money_request'
  },

  {
    path: '/collection',
    icon: 'pledge',
    label: 'Cheque / Amount',
    exact: true,
    permission: 'collection'
  },
  {
    path: '/bank_collection',
    icon: 'pledge',
    label: 'Bank Collection',
    exact: true,
    permission: 'bank_collection'
  },
  {
    path: '/finance_institute',
    icon: 'pledge',
    label: 'Finance Institute',
    exact: true,
    permission: 'finance_institute'
  },
  {
    path: '/gold_collect',
    icon: 'pledge',
    label: 'Gold Collect',
    exact: true,
    permission: 'gold_collect'
  },
  {
    path: '/manager_approval',
    icon: 'pledge',
    label: 'Manager Gold Received',
    exact: true,
    permission: 'manager_approval'
  },
  {
    path: '/religional_manager',
    icon: 'pledge',
    label: 'Collected Packets',
    exact: true,
    permission: 'religional_manager'
  },
  {
    path: '/accounts_approval',
    icon: 'pledge',
    label: 'Pledge Manager (Accounts)',
    exact: true,
    permission: 'accounts_approval'
  },
  {
    path: '/pledge_manager_approval',
    icon: 'pledge',
    label: 'Pledge Manager Approval ',
    exact: true,
    permission: 'pledge_manager_approval'
  },
  {
    path: '/regional_manager_purchase_approval',
    icon: 'purchase',
    label: 'Purchase (Regional Manager)',
    exact: true,
    permission: 'regional_manager_purchase_approval'
  },
  {
    path: '/accounts_purchase_approval',
    icon: 'purchase',
    label: 'Accounts (Regional Manager)',
    exact: true,
    permission: 'accounts_purchase_approval'
  },
  {
    path: '/melting_purchase',
    icon: 'purchase',
    label: 'Packets Received at Accounts',
    exact: true,
    permission: 'melting_purchase'
  },
  {
    path: '/melting_status',
    icon: 'purchase',
    label: 'Melting (Smith Assign)',
    exact: true,
    permission: 'melting_status'
  },
  {
    path: '/melting_receipt',
    icon: 'analytics',
    label: 'Melting Receipt',
    exact: true,
    permission: 'melting_receipt'
  },
  {
    path: '/master_grouping',
    icon: 'users',
    label: 'Master Grouping',
    exact: true,
    permission: 'master_grouping'
  },
  {
    path: '/account_head',
    icon: 'bank',
    label: 'Account Head',
    exact: true,
    permission: 'account_head'
  },
  {
    path: '/account_receipt',
    icon: 'bank',
    label: 'Account Receipt',
    exact: true,
    permission: 'account_receipt'
  },
  {
    path: '/opening_balance',
    icon: 'bank',
    label: 'Opening Balance',
    exact: true,
    permission: 'opening_balance'
  },
  {
    path: '/opening_stock',
    icon: 'analytics',
    label: 'Opening Stock',
    exact: true,
    permission: 'opening_stock'
  },
  {
    path: '/sales',
    icon: 'sales',
    label: 'Sales',
    exact: true,
    permission: 'sales'
  },
  {
    path: '/reports',
    icon: 'report',
    label: 'Reports',
    exact: true,
    permission: 'reports'
  },
  {
    path: '/fix_today_rate',
    icon: 'settings',
    label: 'Fix Today Rate',
    exact: true,
    permission: 'fix_today_rate'
  },
  {
    path: '/margin_settings',
    icon: 'settings',
    label: 'Margin Settings',
    exact: true,
    permission: 'margin_settings'
  },
  // {
  //   path: '/settings',
  //   icon: 'settings',
  //   label: 'Settings',
  // <<<<<<< HEAD
  //   permission: 'settings:setting',
  //   children: [
  //     {
  //       path: '/settings/fix-today-rate',
  //       label: 'Fix Today Rate',
  //       permission: 'settings:setting:fix-today-rate'
  //     },
  //     {
  //       path: '/settings/margin-settings',
  //       label: 'Margin Settings',
  //       permission: 'settings:setting:margin-settings'
  //     }
  //   ]
  // },
  // {
  //   path: '/settings',
  //   icon: 'settings',
  //   label: 'Settings',
  //   exact: true,
  //   permission: 'settings'
  // },
  // {
  //   path: '/settings',
  //   icon: 'settings',
  //   label: 'Settings',
  // =======
  // >>>>>>> 5fa7ad682928a3a622f37222d1916f2be25a1ab7
  //   permission: 'setting:settings',
  //   children: [
  //     {
  //       path: '/settings/fix-today-rate',
  //       label: 'Fix Today Rate',
  //       permission: 'setting:fix-today-rate'
  //     },
  //     {
  //       path: '/settings/margin-settings',
  //       label: 'Margin Settings',
  //       permission: 'setting:margin-settings'
  //     }
  //   ]
  // },
];

export const userProfile = {
  name: 'Super Admin',
  role: 'Administrator',
  avatarText: 'SA',
  email: 'superadmin@Amayagold.com'
};

export const sidebarThemes = {
  royal: {
    name: 'Royal Blue',
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#60a5fa'
  },
  dark: {
    name: 'Dark Mode',
    primary: '#1f2937',
    secondary: '#374151',
    accent: '#6b7280'
  },
  ocean: {
    name: 'Ocean Blue',
    primary: '#0891b2',
    secondary: '#06b6d4',
    accent: '#22d3ee'
  }
};