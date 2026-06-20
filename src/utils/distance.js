function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Bán kính trái đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const distanceKm = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  return distanceKm;
}

function calculateDeliveryFee(storeLat, storeLng, custLat, custLng) {
  const distance = calculateDistance(storeLat, storeLng, custLat, custLng);
  if (distance === 0) return 15000; // Mặc định nếu không có tọa độ
  
  const fee = Math.round(distance * 5000); // 5.000đ/km
  // Làm tròn đến hàng ngàn
  const roundedFee = Math.ceil(fee / 1000) * 1000;
  return Math.max(roundedFee, 15000); // Tối thiểu 15k
}

module.exports = { calculateDistance, calculateDeliveryFee };
