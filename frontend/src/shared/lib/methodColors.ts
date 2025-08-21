// HTTP Method별 색상 유틸리티
export const getMethodColors = (method: string) => {
  switch (method) {
    case 'GET':
      return {
        text: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-300',
        badge: 'bg-green-600'
      };
    case 'POST':
      return {
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        badge: 'bg-blue-600'
      };
    case 'PUT':
      return {
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        badge: 'bg-orange-600'
      };
    case 'DELETE':
      return {
        text: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-300',
        badge: 'bg-red-600'
      };
    case 'PATCH':
      return {
        text: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-300',
        badge: 'bg-purple-600'
      };
    default:
      return {
        text: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-300',
        badge: 'bg-gray-600'
      };
  }
};

// MainContent용 (select box 스타일)
export const getMethodSelectColor = (method: string) => {
  const colors = getMethodColors(method);
  return `${colors.text} ${colors.bg} ${colors.border}`;
};

// Sidebar용 (뱃지 스타일)
export const getMethodBadgeColor = (method: string) => {
  return getMethodColors(method).badge;
};