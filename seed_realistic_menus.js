const { dbPromise } = require('./src/config/db');

const menus = {
  com: [
    { name: 'Cơm Sườn Bì Chả', price: 45000, desc: 'Cơm tấm thơm dẻo, sườn nướng mỡ hành, bì chả nhà làm' },
    { name: 'Cơm Gà Xối Mỡ', price: 40000, desc: 'Đùi gà xối mỡ giòn rụm, kèm mắm tỏi' },
    { name: 'Cơm Chiên Dương Châu', price: 35000, desc: 'Cơm chiên hải sản, lạp xưởng, rau củ' },
    { name: 'Cơm Ba Dọi Nướng', price: 40000, desc: 'Ba dọi nướng lửa hồng thơm lừng' },
    { name: 'Cơm Thêm', price: 5000, desc: 'Cơm trắng dẻo thơm' },
    { name: 'Sườn Nướng (Thêm)', price: 25000, desc: 'Sườn cốt lết nướng mật ong' },
    { name: 'Trứng Ốp La', price: 7000, desc: 'Trứng gà ốp la lòng đào' },
    { name: 'Chả Trứng Cấp Tốc', price: 10000, desc: 'Chả trứng hấp thịt băm mộc nhĩ' },
    { name: 'Canh Khổ Qua Nhồi Thịt', price: 15000, desc: 'Canh thanh mát giải nhiệt' },
    { name: 'Canh Rong Biển', price: 12000, desc: 'Canh rong biển đậu hũ thịt băm' },
    { name: 'Canh Chua Cá Lóc', price: 20000, desc: 'Canh chua chua ngọt ngọt chuẩn vị miền Tây' },
    { name: 'Trà Đá', price: 2000, desc: 'Trà đá giải khát' },
    { name: 'Trà Tắc', price: 12000, desc: 'Trà tắc chua ngọt khổng lồ' },
    { name: 'Pepsi', price: 15000, desc: 'Lon 320ml' },
    { name: 'Khăn lạnh', price: 2000, desc: 'Khăn ướt tiệt trùng' }
  ],
  fastfood: [
    { name: 'Gà Rán Giòn Cay (1 miếng)', price: 35000, desc: 'Gà tẩm bột chiên giòn rụm cay nhẹ' },
    { name: 'Gà Truyền Thống (1 miếng)', price: 34000, desc: 'Gà rán vị nguyên bản' },
    { name: 'Combo 3 Miếng Gà', price: 99000, desc: 'Gồm 3 miếng gà + 1 Pepsi' },
    { name: 'Gà Quay Tiêu', price: 40000, desc: 'Gà quay giấy bạc sốt tiêu đen' },
    { name: 'Burger Zinger', price: 45000, desc: 'Burger phi lê gà cay, xà lách, sốt mayo' },
    { name: 'Burger Bò Phô Mai', price: 40000, desc: 'Burger bò bằm mọng nước và phô mai cheddar' },
    { name: 'Khoai Tây Chiên (Vừa)', price: 18000, desc: 'Khoai tây chiên muối tinh' },
    { name: 'Khoai Tây Lắc Phô Mai', price: 25000, desc: 'Khoai tây chiên phủ bột phô mai' },
    { name: 'Salad Bắp Cải (Vừa)', price: 15000, desc: 'Salad bắp cải sốt mayo thanh mát' },
    { name: 'Mì Ý Sốt Bò Băm', price: 40000, desc: 'Mì Ý sốt cà chua thịt bò bằm' },
    { name: 'Kem Cây Vani', price: 10000, desc: 'Kem ốc quế mát lạnh' },
    { name: 'Gà Viên Chiên', price: 30000, desc: 'Gà viên tẩm bột chiên Popcorn' },
    { name: 'Bánh Trứng', price: 17000, desc: 'Bánh tart trứng Bồ Đào Nha nướng' },
    { name: 'Coca Cola (Ly lớn)', price: 15000, desc: 'Giải khát sảng khoái' },
    { name: 'Trà Đào Cam Sả', price: 25000, desc: 'Trà đào thanh mát' }
  ],
  trasua: [
    { name: 'Trà Sữa Trân Châu Đường Đen', price: 35000, desc: 'Sữa tươi thanh trùng, trân châu nấu đường đen dẻo' },
    { name: 'Trà Sữa Ô Long Nướng', price: 40000, desc: 'Trà Ô long đậm vị, thơm mùi khói nướng' },
    { name: 'Trà Sen Vàng', price: 45000, desc: 'Trà đen, hạt sen bùi, củ năng giòn và macchiato' },
    { name: 'Trà Đào Cam Sả', price: 45000, desc: 'Trà thanh mát với đào miếng và sả thơm' },
    { name: 'Phin Sữa Đá', price: 29000, desc: 'Cà phê phin truyền thống Việt Nam pha sữa đặc' },
    { name: 'Bạc Xỉu', price: 29000, desc: 'Nhiều sữa, ít cà phê, béo ngậy' },
    { name: 'Freeze Trà Xanh', price: 55000, desc: 'Đá xay matcha, thạch xanh và kem tươi' },
    { name: 'Hồng Trà Macchiato', price: 38000, desc: 'Hồng trà thanh nhẹ kèm lớp kem phô mai mặn' },
    { name: 'Nước Chanh Giã Tay', price: 20000, desc: 'Chanh tươi giã tay chua chua ngọt ngọt' },
    { name: 'Kem Tươi Trân Châu', price: 25000, desc: 'Kem lạnh phủ trân châu đường đen' },
    { name: 'Trà Dâu Tằm', price: 35000, desc: 'Trà trái cây dâu tằm chua ngọt' },
    { name: 'Trà Vải Nhiệt Đới', price: 40000, desc: 'Trà vải ngọt thanh kèm trái vải ngâm' },
    { name: 'Cà Phê Đen Đá', price: 25000, desc: 'Cà phê nguyên chất rang xay đậm đà' },
    { name: 'Bánh Mì Que Pate', price: 15000, desc: 'Bánh mì que giòn xốp nhân pate gan' },
    { name: 'Bánh Mousse Trà Xanh', price: 35000, desc: 'Bánh ngọt mềm tan vị matcha' }
  ],
  bundau: [
    { name: 'Bún Đậu Mắm Tôm (Thập Cẩm)', price: 55000, desc: 'Bún, đậu, thịt luộc, chả cốm, dồi sụn, nem chua' },
    { name: 'Bún Đậu (Thường)', price: 35000, desc: 'Bún, đậu mơ chiên giòn, mắm tôm' },
    { name: 'Chả Cốm Chiên', price: 20000, desc: 'Chả cốm Hà Nội dẻo thơm' },
    { name: 'Dồi Sụn Chiên', price: 25000, desc: 'Dồi sụn sần sật béo ngậy' },
    { name: 'Thịt Chân Giò Luộc', price: 25000, desc: 'Thịt bắp giò thái lát mỏng' },
    { name: 'Nem Chua Rán', price: 30000, desc: 'Nem chua tẩm bột chiên giòn' },
    { name: 'Đậu Mơ Chiên Thêm', price: 15000, desc: 'Đậu hũ non chiên giòn rụm ngoài, mềm trong' },
    { name: 'Chả Mực Hạ Long', price: 40000, desc: 'Chả mực giã tay dai ngon' },
    { name: 'Bún Lá Thêm', price: 5000, desc: 'Bún lá ép chặt' },
    { name: 'Mắm Tôm Pha Sẵn', price: 5000, desc: 'Mắm tôm Thanh Hóa đánh bọt với tắc, đường' },
    { name: 'Nước Sấu Ngâm', price: 15000, desc: 'Nước sấu chua ngọt mát lạnh' },
    { name: 'Nước Mơ Ngâm', price: 15000, desc: 'Nước mơ chua chua, thơm nồng' },
    { name: 'Trà Chanh', price: 10000, desc: 'Trà chanh giã tay' },
    { name: 'Bún Chả Hà Nội', price: 50000, desc: 'Bún chả nướng than hoa, nước mắm chua ngọt' },
    { name: 'Chả Giò (Nem Rán)', price: 15000, desc: 'Chả giò nhân thịt nấm mèo' }
  ]
};

async function seed() {
  console.log('Clearing old menu items...');
  await dbPromise.run(`DELETE FROM MenuItems`);

  const stores = await dbPromise.all(`SELECT id, username, category FROM Users WHERE role = 'store'`);
  
  for (let s of stores) {
    let menuType = 'com';
    const user = s.username.toLowerCase();
    
    if (s.category === 'FastFood' || user.includes('kfc') || user.includes('mcdonald')) {
      menuType = 'fastfood';
    } else if (s.category === 'Trà Sữa' || user.includes('highland') || user.includes('phuclong') || user.includes('mixue')) {
      menuType = 'trasua';
    } else if (user.includes('bun') || user.includes('bún')) {
      menuType = 'bundau';
    } else {
      menuType = 'com';
    }

    const items = menus[menuType];
    for (let item of items) {
      try {
        await dbPromise.run(
          `INSERT INTO MenuItems (store_id, name, price, description) VALUES (?, ?, ?, ?)`,
          [s.id, item.name, item.price, item.desc]
        );
      } catch(e) {
        console.error('Error inserting item', item.name, e.message);
      }
    }
    console.log(`Inserted ${items.length} items for store ${s.username} (type: ${menuType})`);
  }

  console.log('Real menu data seed complete!');
  process.exit(0);
}

seed();
