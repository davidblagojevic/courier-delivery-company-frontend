export enum ECourierStatus {
  AVAILABLE = 'Available',
  UNAVAILABLE = 'Unavailable', 
  OFFLINE = 'Offline'
}

// Map frontend enum values to backend integer values
export const courierStatusToBackendValue = {
  [ECourierStatus.AVAILABLE]: 0,
  [ECourierStatus.UNAVAILABLE]: 1,
  [ECourierStatus.OFFLINE]: 2
};

// Map backend integer values to frontend enum values
export const courierStatusFromBackendValue = {
  0: ECourierStatus.AVAILABLE,
  1: ECourierStatus.UNAVAILABLE,
  2: ECourierStatus.OFFLINE
};

export const courierStatusLabels = {
  [ECourierStatus.AVAILABLE]: 'Available',
  [ECourierStatus.UNAVAILABLE]: 'Unavailable',
  [ECourierStatus.OFFLINE]: 'Offline'
};

export const getCourierStatusColor = (status: ECourierStatus) => {
  switch (status) {
    case ECourierStatus.AVAILABLE:
      return 'success';
    case ECourierStatus.UNAVAILABLE:
      return 'warning';
    case ECourierStatus.OFFLINE:
      return 'error';
    default:
      return 'default';
  }
};