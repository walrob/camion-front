export const useAuth = () => {
  const authStore = useAuthStore();
  return {
    ...authStore.user,
    isAdmin: authStore.isAdmin,
    isManager: authStore.isManager,
    isDispatcher: authStore.isDispatcher,
    isMaintenance: authStore.isMaintenance,
    isDriver: authStore.isDriver,
    isHr: authStore.isHr,
    isAuditor: authStore.isAuditor,
  };
};
