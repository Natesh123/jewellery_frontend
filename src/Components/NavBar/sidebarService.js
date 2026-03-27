import { sidebarItems } from '../../config/sidebarItems';

export const filterSidebarItems = (permissions) => {
  const filterItems = (items) => {
    return items.filter(item => {
      // If item has children, filter them first
      if (item.children) {
        const filteredChildren = filterItems(item.children);
        // Only keep parent if it has children or has its own permission
        return filteredChildren.length > 0 ||
          (item.permission && permissions.includes(item.permission));
      }
      // For items without children, check permission
      return !item.permission || permissions.includes(item.permission);
    });
  };

  return filterItems([...sidebarItems]);
};