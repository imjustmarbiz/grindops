export function displayId(entity: { displayId?: string | null; id: string; mgtOrderNumber?: number | null }): string {
  if (entity.displayId) return entity.displayId;
  if ('mgtOrderNumber' in entity && entity.mgtOrderNumber) {
    return `ORD-${String(entity.mgtOrderNumber).padStart(2, '0')}`;
  }
  return entity.id;
}

export function orderLabel(order: { displayId?: string | null; id: string; mgtOrderNumber?: number | null }): string {
  if (order.displayId) return order.displayId;
  if (order.mgtOrderNumber) return `#${order.mgtOrderNumber}`;
  return order.id;
}
