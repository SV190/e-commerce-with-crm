-- Очищаем существующие данные (опционально)
-- TRUNCATE TABLE products CASCADE;

-- Добавляем товары с артикулами
INSERT INTO products (name, description, price, article, image_url) VALUES
-- Электроника
('Смартфон iPhone 13', 'Мощный смартфон с отличной камерой и производительностью', 79999.00, 'ELEC-IP13-001', 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=500&h=350&auto=format&fit=crop'),
('Ноутбук HP Pavilion', '15.6" FHD, Intel Core i5, 8GB RAM, 512GB SSD', 59999.00, 'ELEC-NB-HP001', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500&h=350&auto=format&fit=crop'),
('Телевизор Samsung QLED', '55" 4K UHD Smart TV с HDR и голосовым управлением', 89999.00, 'ELEC-TV-SM001', 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=500&h=350&auto=format&fit=crop'),
('Наушники Sony WH-1000XM4', 'Беспроводные наушники с шумоподавлением', 27999.00, 'ELEC-AUDIO-SN001', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=500&h=350&auto=format&fit=crop'),
('Планшет Samsung Galaxy Tab S7', '11" AMOLED, 128GB, Wi-Fi + 5G', 45999.00, 'ELEC-TAB-SM001', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=500&h=350&auto=format&fit=crop'),
('Смартфон Samsung Galaxy S22', 'Флагманский смартфон с продвинутой камерой', 69999.00, 'ELEC-SP-SM001', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=500&h=350&auto=format&fit=crop'),
('Умные часы Apple Watch Series 7', 'Инновационные часы с функцией ЭКГ и всегда активным дисплеем', 34999.00, 'ELEC-WATCH-AP001', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=500&h=350&auto=format&fit=crop'),
('Фотоаппарат Canon EOS R5', 'Полнокадровая беззеркальная камера с разрешением 45 МП', 299999.00, 'ELEC-CAM-CN001', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=500&h=350&auto=format&fit=crop'),

-- Одежда
('Футболка мужская', 'Хлопковая футболка классического кроя', 1299.00, 'CLOTH-TSHM-001', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=500&h=350&auto=format&fit=crop'),
('Джинсы женские', 'Стильные джинсы с высокой посадкой', 2999.00, 'CLOTH-JW-001', 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=500&h=350&auto=format&fit=crop'),
('Платье вечернее', 'Элегантное вечернее платье с открытой спиной', 5999.00, 'CLOTH-DRESS-001', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&h=350&auto=format&fit=crop'),
('Куртка зимняя', 'Теплая куртка с капюшоном и утеплителем', 7999.00, 'CLOTH-JKT-001', 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=500&h=350&auto=format&fit=crop'),
('Кроссовки Nike Air Max', 'Спортивные кроссовки с амортизацией', 8499.00, 'CLOTH-SHOE-NK001', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=500&h=350&auto=format&fit=crop'),
('Рубашка мужская', 'Классическая рубашка из хлопка', 2499.00, 'CLOTH-SHRM-001', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=500&h=350&auto=format&fit=crop'),
('Юбка миди', 'Стильная юбка средней длины', 1999.00, 'CLOTH-SKRT-001', 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=500&h=350&auto=format&fit=crop'),
('Свитер вязаный', 'Теплый свитер крупной вязки', 2799.00, 'CLOTH-SWTR-001', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=500&h=350&auto=format&fit=crop'),

-- Дом и сад
('Стол обеденный', 'Современный обеденный стол из массива дерева', 15999.00, 'HOME-TB-001', 'https://images.unsplash.com/photo-1554295405-abb8fd54f153?q=80&w=500&h=350&auto=format&fit=crop'),
('Стул кухонный', 'Удобный стул с мягким сиденьем', 3999.00, 'HOME-CHR-001', 'https://images.unsplash.com/photo-1561677978-583a8c7a4b43?q=80&w=500&h=350&auto=format&fit=crop'),
('Диван угловой', 'Просторный угловой диван с обивкой из экокожи', 45999.00, 'HOME-SOF-001', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=500&h=350&auto=format&fit=crop'),
('Лампа настольная', 'Стильная настольная лампа с регулировкой яркости', 2499.00, 'HOME-LMP-001', 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=500&h=350&auto=format&fit=crop'),
('Шкаф-купе', 'Вместительный шкаф-купе с зеркалом', 29999.00, 'HOME-WRD-001', 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=500&h=350&auto=format&fit=crop'),
('Постельное белье', 'Комплект постельного белья из сатина', 3999.00, 'HOME-BED-001', 'https://images.unsplash.com/photo-1629949009765-791dda14d90c?q=80&w=500&h=350&auto=format&fit=crop'),
('Кастрюля с крышкой', 'Кастрюля из нержавеющей стали 5л', 2499.00, 'HOME-KCH-001', 'https://images.unsplash.com/photo-1584168544245-68640e61c586?q=80&w=500&h=350&auto=format&fit=crop'),
('Набор посуды', 'Набор столовой посуды на 6 персон', 5999.00, 'HOME-DISH-001', 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?q=80&w=500&h=350&auto=format&fit=crop'),

-- Спорт
('Гантели 5кг', 'Пара гантелей для фитнеса весом 5кг', 1999.00, 'SPORT-DUMB-001', 'https://images.unsplash.com/photo-1590645833383-c4f67e5b6af5?q=80&w=500&h=350&auto=format&fit=crop'),
('Тренажер многофункциональный', 'Домашний многофункциональный силовой тренажер', 59999.00, 'SPORT-EQP-001', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=500&h=350&auto=format&fit=crop'),
('Велосипед горный', 'Горный велосипед с 21 скоростью', 25999.00, 'SPORT-BIKE-001', 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=500&h=350&auto=format&fit=crop'),
('Мяч футбольный', 'Профессиональный футбольный мяч', 1999.00, 'SPORT-BALL-001', 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=500&h=350&auto=format&fit=crop'),
('Скейтборд', 'Скейтборд для трюков и городского катания', 4999.00, 'SPORT-SKAT-001', 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?q=80&w=500&h=350&auto=format&fit=crop'),
('Коврик для йоги', 'Нескользящий коврик для йоги и фитнеса', 1299.00, 'SPORT-YOGA-001', 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?q=80&w=500&h=350&auto=format&fit=crop'),
('Боксерская груша', 'Боксерская груша для тренировок', 5499.00, 'SPORT-BOX-001', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=500&h=350&auto=format&fit=crop'),
('Лыжи беговые', 'Комплект беговых лыж с креплениями', 12999.00, 'SPORT-SKI-001', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=500&h=350&auto=format&fit=crop'),

-- Красота и здоровье
('Помада матовая', 'Стойкая матовая помада', 999.00, 'BEAUTY-LIP-001', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=500&h=350&auto=format&fit=crop'),
('Крем для лица', 'Увлажняющий крем для всех типов кожи', 1499.00, 'BEAUTY-FACE-001', 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=500&h=350&auto=format&fit=crop'),
('Парфюм женский', 'Изысканный аромат с цветочными нотами', 3999.00, 'BEAUTY-PERF-001', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=500&h=350&auto=format&fit=crop'),
('Шампунь', 'Восстанавливающий шампунь для поврежденных волос', 799.00, 'BEAUTY-HAIR-001', 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=500&h=350&auto=format&fit=crop'),
('Маска для лица', 'Омолаживающая тканевая маска', 299.00, 'BEAUTY-MASK-001', 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?q=80&w=500&h=350&auto=format&fit=crop'),
('Тушь для ресниц', 'Объемная тушь с эффектом накладных ресниц', 699.00, 'BEAUTY-MSCR-001', 'https://images.unsplash.com/photo-1591360236340-97ad15716b41?q=80&w=500&h=350&auto=format&fit=crop'),
('Тени для век', 'Палетка теней с 12 оттенками', 1299.00, 'BEAUTY-EYE-001', 'https://images.unsplash.com/photo-1573051033184-1c8b6666509d?q=80&w=500&h=350&auto=format&fit=crop'),
('Массажер для лица', 'Роликовый массажер для ухода за кожей', 1999.00, 'BEAUTY-MAS-001', 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?q=80&w=500&h=350&auto=format&fit=crop'),

-- Детские товары
('Конструктор LEGO', 'Набор LEGO для развития творческих способностей', 2499.00, 'TOY-LEGO-001', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=500&h=350&auto=format&fit=crop'),
('Кукла Барби', 'Классическая кукла Барби с аксессуарами', 999.00, 'TOY-BARB-001', 'https://images.unsplash.com/photo-1598931247655-f9a3633f1330?q=80&w=500&h=350&auto=format&fit=crop'),
('Машинка радиоуправляемая', 'Радиоуправляемая машинка-внедорожник', 2999.00, 'TOY-CAR-001', 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=500&h=350&auto=format&fit=crop'),
('Пазл 1000 элементов', 'Пазл с красивым пейзажем, 1000 элементов', 799.00, 'TOY-PZL-001', 'https://images.unsplash.com/photo-1606503153255-59d8b2e4739e?q=80&w=500&h=350&auto=format&fit=crop'),
('Мягкая игрушка', 'Плюшевый медвежонок, 30 см', 999.00, 'TOY-SOFT-001', 'https://images.unsplash.com/photo-1563901935883-cb9bb647cbb8?q=80&w=500&h=350&auto=format&fit=crop'),
('Настольная игра "Монополия"', 'Классическая версия популярной игры', 1799.00, 'TOY-BOARD-001', 'https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?q=80&w=500&h=350&auto=format&fit=crop'),
('Игровая приставка', 'Портативная игровая консоль с 100 играми', 4999.00, 'TOY-CONS-001', 'https://images.unsplash.com/photo-1605134558427-60d7bc359b17?q=80&w=500&h=350&auto=format&fit=crop'),
('Развивающий коврик', 'Интерактивный коврик для малышей', 1999.00, 'TOY-BABY-001', 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?q=80&w=500&h=350&auto=format&fit=crop'),

-- Продукты питания
('Шоколад темный', 'Горький шоколад 70% какао, 100г', 299.00, 'FOOD-CHOC-001', 'https://images.unsplash.com/photo-1606312619070-d48b4c652ba5?q=80&w=500&h=350&auto=format&fit=crop'),
('Кофе в зернах', 'Арабика, средняя обжарка, 500г', 899.00, 'FOOD-COF-001', 'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?q=80&w=500&h=350&auto=format&fit=crop'),
('Чай зеленый', 'Крупнолистовой зеленый чай, 100г', 399.00, 'FOOD-TEA-001', 'https://images.unsplash.com/photo-1546890975-caffedb451e5?q=80&w=500&h=350&auto=format&fit=crop'),
('Набор орехов', 'Ассорти орехов и сухофруктов, 300г', 699.00, 'FOOD-NUTS-001', 'https://images.unsplash.com/photo-1567015834093-6d9ed6a87d9d?q=80&w=500&h=350&auto=format&fit=crop'),
('Мед натуральный', 'Цветочный мед, 500г', 499.00, 'FOOD-HONEY-001', 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?q=80&w=500&h=350&auto=format&fit=crop'),
('Оливковое масло', 'Оливковое масло Extra Virgin, 500мл', 899.00, 'FOOD-OIL-001', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=500&h=350&auto=format&fit=crop'),
('Печенье ассорти', 'Набор печенья и вафель, 400г', 399.00, 'FOOD-COOKIE-001', 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?q=80&w=500&h=350&auto=format&fit=crop'),
('Натуральный сок', 'Апельсиновый сок прямого отжима, 1л', 299.00, 'FOOD-JUICE-001', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=500&h=350&auto=format&fit=crop'),

-- Книги
('Роман "Мастер и Маргарита"', 'Известный роман Михаила Булгакова', 599.00, 'BOOK-CLASS-001', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=500&h=350&auto=format&fit=crop'),
('Детектив "Убийство в Восточном экспрессе"', 'Классический детектив Агаты Кристи', 499.00, 'BOOK-DET-001', 'https://images.unsplash.com/photo-1629194211576-fd300896ecbc?q=80&w=500&h=350&auto=format&fit=crop'),
('Учебник по программированию', 'Основы программирования на Python', 1299.00, 'BOOK-PROG-001', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=500&h=350&auto=format&fit=crop'),
('Энциклопедия', 'Большая иллюстрированная энциклопедия', 1599.00, 'BOOK-ENC-001', 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=500&h=350&auto=format&fit=crop'),
('Книга по кулинарии', 'Рецепты национальных кухонь мира', 899.00, 'BOOK-COOK-001', 'https://images.unsplash.com/photo-1576349970238-d52e31de9b64?q=80&w=500&h=350&auto=format&fit=crop'),
('Фантастика "Дюна"', 'Культовый научно-фантастический роман', 699.00, 'BOOK-SCI-001', 'https://images.unsplash.com/photo-1518744946729-879f1d49ba5a?q=80&w=500&h=350&auto=format&fit=crop'),
('Биография "Стив Джобс"', 'Биография основателя Apple', 899.00, 'BOOK-BIO-001', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=500&h=350&auto=format&fit=crop'),
('Сборник стихов', 'Избранные произведения классиков поэзии', 499.00, 'BOOK-POET-001', 'https://images.unsplash.com/photo-1526572202046-8b13092d5e4b?q=80&w=500&h=350&auto=format&fit=crop');

-- Добавляем индекс для fulltext поиска (опционально)
CREATE INDEX IF NOT EXISTS idx_products_fulltext ON products USING gin(to_tsvector('russian', name || ' ' || description)); 