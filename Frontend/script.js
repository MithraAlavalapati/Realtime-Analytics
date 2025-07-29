// --- Mock Product Data ---
const products = [
    // Fashion - 20 products
    { id: 'f001', name: 'Elegant Evening Dress', category: 'Fashion', price: 89.99, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Elegant+Dress', description: 'A stunning dress perfect for evening events. Made from high-quality silk blend.', brand: 'Glamourous Attire', variant: 'Blue-Large' },
    { id: 'f002', name: 'Men\'s Slim Fit Shirt', category: 'Fashion', price: 34.99, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Slim+Fit+Shirt', description: 'A crisp, slim-fit shirt made from 100% breathable cotton. Ideal for work or casual wear.', brand: 'Gentleman\'s Choice', variant: 'White-Medium' },
    { id: 'f003', name: 'High-Waisted Denim Jeans', category: 'Fashion', price: 49.99, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Denim+Jeans', description: 'Classic high-waisted denim jeans with a modern fit. Durable and stylish.', brand: 'Denim Dreams', variant: 'Blue-Size28' },
    { id: 'f004', name: 'Classic Summer Hat', category: 'Fashion', price: 18.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Summer+Hat', description: 'Protect yourself from the sun with this timeless and fashionable summer hat.', brand: 'SunShield', variant: 'Straw-Beige' },
    { id: 'f005', name: 'Women\'s Floral Blouse', category: 'Fashion', price: 27.50, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Floral+Blouse', description: 'A beautiful floral blouse perfect for spring and summer.', brand: 'BloomWear', variant: 'Multi-color-S' },
    { id: 'f006', name: 'Sporty Sneakers', category: 'Fashion', price: 65.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Sporty+Sneakers', description: 'Comfortable and stylish sneakers for everyday wear.', brand: 'StrideFoot', variant: 'Black-Size9' },
    { id: 'f007', name: 'Leather Crossbody Bag', category: 'Fashion', price: 120.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Crossbody+Bag', description: 'A chic and practical leather bag with adjustable strap.', brand: 'Elegance Carry', variant: 'Brown' },
    { id: 'f008', name: 'Cozy Knit Sweater', category: 'Fashion', price: 55.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Knit+Sweater', description: 'Soft and warm knit sweater, perfect for chilly evenings.', brand: 'WarmWeave', variant: 'Grey-L' },
    { id: 'f009', name: 'Aviator Sunglasses', category: 'Fashion', price: 25.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Aviator+Sunglasses', description: 'Classic aviator sunglasses with UV protection.', brand: 'VisionPro', variant: 'Gold Frame' },
    { id: 'f010', name: 'Running Shorts', category: 'Fashion', price: 29.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Running+Shorts', description: 'Lightweight and breathable shorts for your runs.', brand: 'ActiveFit', variant: 'Black-M' },
    { id: 'f011', name: 'Wool Blend Scarf', category: 'Fashion', price: 22.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Wool+Scarf', description: 'Soft and warm scarf, ideal for cold weather.', brand: 'WinterWarmth', variant: 'Red Plaid' },
    { id: 'f012', name: 'Classic Leather Belt', category: 'Fashion', price: 30.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Leather+Belt', description: 'Durable and stylish leather belt for any outfit.', brand: 'BeltMaster', variant: 'Black-34' },
    { id: 'f013', name: 'Striped T-Shirt', category: 'Fashion', price: 19.50, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Striped+T-Shirt', description: 'Comfortable cotton t-shirt with classic stripes.', brand: 'CasualComfort', variant: 'Navy Stripe-S' },
    { id: 'f014', name: 'Plaid Flannel Shirt', category: 'Fashion', price: 42.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Flannel+Shirt', description: 'Warm and cozy flannel shirt, perfect for casual wear.', brand: 'Lumberjack Style', variant: 'Red Plaid-L' },
    { id: 'f015', name: 'Ballet Flats', category: 'Fashion', price: 38.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Ballet+Flats', description: 'Elegant and comfortable ballet flats for everyday.', brand: 'Graceful Steps', variant: 'Black-Size7' },
    { id: 'f016', name: 'Sportswear Leggings', category: 'Fashion', price: 35.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Leggings', description: 'Flexible and breathable leggings for workouts or leisure.', brand: 'FlexActive', variant: 'Grey-M' },
    { id: 'f017', 'name': 'Denim Jacket', category: 'Fashion', price: 75.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Denim+Jacket', description: 'Timeless denim jacket, a versatile wardrobe staple.', brand: 'Classic Denim', variant: 'Light Wash-L' },
    { id: 'f018', name: 'Boho Maxi Skirt', category: 'Fashion', price: 45.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Maxi+Skirt', description: 'Flowy and comfortable maxi skirt with a bohemian print.', brand: 'FreeSpirit', variant: 'Floral-One Size' },
    { id: 'f019', name: 'Casual Hoodie', category: 'Fashion', price: 50.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Casual+Hoodie', description: 'Soft and warm hoodie for ultimate comfort.', brand: 'ComfyCo', variant: 'Navy-XL' },
    { id: 'f020', name: 'Waterproof Raincoat', category: 'Fashion', price: 60.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Raincoat', description: 'Stay dry in style with this lightweight waterproof raincoat.', brand: 'RainGuard', variant: 'Yellow-M' },


    // Mobiles/Computers - 20 products
    { id: 'm001', name: 'Flagship Smartphone Pro', category: 'Mobiles/Computers', price: 999.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Smartphone+Pro', description: 'The latest flagship smartphone with a stunning display and pro-grade camera system.', brand: 'ApexTech', variant: 'Midnight Black-512GB' },
    { id: 'm002', name: 'Ultra-Thin Laptop Air', category: 'Mobiles/Computers', price: 1350.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Laptop+Air', description: 'Incredibly light and powerful, this laptop is perfect for professionals on the go.', brand: 'FeatherLight', variant: 'Silver-16GB RAM' },
    { id: 'm003', name: 'Noise-Cancelling Headphones', category: 'Mobiles/Computers', price: 149.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Headphones', description: 'Immerse yourself in sound with these top-tier noise-cancelling headphones.', brand: 'SoundScape', variant: 'Matte Black' },
    { id: 'm004', name: 'Gaming Desktop PC', category: 'Mobiles/Computers', price: 1800.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Gaming+PC', description: 'High-performance gaming PC for an unparalleled gaming experience.', brand: 'GamerForge', variant: 'RTX 4070-16GB RAM' },
    { id: 'm005', name: 'Wireless Ergonomic Mouse', category: 'Mobiles/Computers', price: 45.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Wireless+Mouse', description: 'Comfortable and precise wireless mouse for extended use.', brand: 'ErgoGlide', variant: 'Graphite' },
    { id: 'm006', name: '4K UHD Monitor', category: 'Mobiles/Computers', price: 350.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=4K+Monitor', description: 'Stunning 4K resolution monitor for crystal-clear visuals.', brand: 'VividDisplay', variant: '27-inch' },
    { id: 'm007', name: 'Portable SSD 1TB', category: 'Mobiles/Computers', price: 110.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Portable+SSD', description: 'Fast and compact external solid-state drive for all your data.', brand: 'SpeedyStore', variant: 'USB-C' },
    { id: 'm008', name: 'Smartwatch Series X', category: 'Mobiles/Computers', price: 299.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Smartwatch', description: 'Stay connected and track your fitness with this advanced smartwatch.', brand: 'HealthTech', variant: 'Midnight Blue' },
    { id: 'm009', name: 'Webcam Pro HD', category: 'Mobiles/Computers', price: 75.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Webcam+HD', description: 'High-definition webcam for clear video calls and streaming.', brand: 'StreamCam', variant: '1080p' },
    { id: 'm010', name: 'Mesh Wi-Fi System', category: 'Mobiles/Computers', price: 199.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Mesh+WiFi', description: 'Eliminate dead zones with seamless whole-home Wi-Fi coverage.', brand: 'HomeNet', variant: '3-Pack' },
    { id: 'm011', name: 'External Hard Drive 2TB', category: 'Mobiles/Computers', price: 80.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=External+HDD', description: 'Reliable storage for all your backups and large files.', brand: 'DataVault', variant: 'USB 3.0' },
    { id: 'm012', name: 'Bluetooth Keyboard', category: 'Mobiles/Computers', price: 60.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Bluetooth+Keyboard', description: 'Compact and portable keyboard for all your devices.', brand: 'Typemaster', variant: 'Compact Layout' },
    { id: 'm013', name: 'Portable Bluetooth Speaker', category: 'Mobiles/Computers', price: 70.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Bluetooth+Speaker', description: 'Enjoy high-quality sound on the go with this portable speaker.', brand: 'AudioGo', variant: 'Blue' },
    { id: 'm014', name: 'Graphics Tablet', category: 'Mobiles/Computers', price: 250.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Graphics+Tablet', description: 'Perfect for digital artists and designers.', brand: 'ArtFlow', variant: 'Medium Size' },
    { id: 'm015', name: 'USB-C Hub Multiport Adapter', category: 'Mobiles/Computers', price: 40.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=USB-C+Hub', description: 'Expand your laptop\'s connectivity with this versatile hub.', brand: 'ConnectAll', variant: '7-in-1' },
    { id: 'm016', name: 'Wireless Charging Pad', category: 'Mobiles/Computers', price: 25.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Wireless+Charger', description: 'Convenient and fast wireless charging for compatible devices.', brand: 'PowerBeam', variant: 'Fast Charge' },
    { id: 'm017', name: 'Digital Camera Mirrorless', category: 'Mobiles/Computers', price: 750.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Mirrorless+Camera', description: 'Capture stunning photos and videos with this compact mirrorless camera.', brand: 'LensCrafter', variant: 'APS-C' },
    { id: 'm018', name: 'VR Headset immersive', category: 'Mobiles/Computers', price: 399.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=VR+Headset', description: 'Step into virtual worlds with this immersive VR headset.', brand: 'RealityDive', variant: 'Standalone' },
    { id: 'm019', name: 'Smart Home Speaker with AI', category: 'Mobiles/Computers', price: 120.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Smart+Speaker', description: 'Voice-controlled smart speaker with integrated AI assistant.', brand: 'EchoHome', variant: 'Gen 4' },
    { id: 'm020', name: 'Portable Power Bank 20000mAh', category: 'Mobiles/Computers', price: 50.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Power+Bank', description: 'Keep your devices charged on the go with this high-capacity power bank.', brand: 'JuiceBox', variant: 'USB-PD' },

    // Home - 20 products
    { id: 'h001', name: 'Smart Home Hub', category: 'Home', price: 79.99, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Smart+Hub', description: 'Centralized control for all your smart home devices.', brand: 'ConnectCentral', variant: 'Gen 2' },
    { id: 'h002', name: 'Robotic Vacuum Cleaner', category: 'Home', price: 299.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Robot+Vacuum', description: 'Automate your cleaning with this intelligent robotic vacuum.', brand: 'CleanBot', variant: 'Self-Emptying' },
    { id: 'h003', name: 'Air Fryer XL', category: 'Home', price: 89.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Air+Fryer', description: 'Cook healthier meals with less oil using this large capacity air fryer.', brand: 'CrispyCook', variant: '5.8QT' },
    { id: 'h004', name: 'Coffee Maker Pro', category: 'Home', price: 120.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Coffee+Maker', description: 'Brew perfect coffee every time with this professional-grade machine.', brand: 'BrewMaster', variant: '12-Cup' },
    { id: 'h005', name: 'LED Smart Lighting Kit', category: 'Home', price: 59.99, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Smart+Lights', description: 'Customize your home ambiance with smart, color-changing LED lights.', brand: 'LumiSmart', variant: 'Starter Kit' },
    { id: 'h006', name: 'Blender High-Speed', category: 'Home', price: 70.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Blender', description: 'Effortlessly blend smoothies, soups, and more with powerful motor.', brand: 'BlendForce', variant: '1000W' },
    { id: 'h007', name: 'Toaster Oven Convection', category: 'Home', price: 95.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Toaster+Oven', description: 'Bake, toast, and broil with this versatile countertop appliance.', brand: 'BakePro', variant: 'Compact' },
    { id: 'h008', name: 'Digital Kitchen Scale', category: 'Home', price: 25.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Kitchen+Scale', description: 'Precise measurements for perfect cooking and baking.', brand: 'MeasureRite', variant: 'Stainless Steel' },
    { id: 'h009', name: 'Cordless Handheld Vacuum', category: 'Home', price: 65.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Handheld+Vacuum', description: 'Quick and easy cleanup for small messes around the house.', brand: 'DustAway', variant: 'Lightweight' },
    { id: 'h010', name: 'Water Filter Pitcher', category: 'Home', price: 30.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Water+Pitcher', description: 'Enjoy cleaner, great-tasting water with this filter pitcher.', brand: 'AquaClear', variant: '2.5L' },
    { id: 'h011', name: 'Stand Mixer Pro', category: 'Home', price: 200.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Stand+Mixer', description: 'Whip, knead, and mix with ease for all your baking needs.', brand: 'KitchenAid', variant: '5-Quart' },
    { id: 'h012', name: 'Essential Oil Diffuser', category: 'Home', price: 35.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Oil+Diffuser', description: 'Create a relaxing ambiance with aromatic essential oils.', brand: 'AromaLux', variant: 'Wood Grain' },
    { id: 'h013', name: 'Smart Doorbell Camera', category: 'Home', price: 150.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Doorbell+Camera', description: 'Monitor your front door from anywhere with motion detection.', brand: 'RingSafe', variant: 'Video HD' },
    { id: 'h014', name: 'Digital Meat Thermometer', category: 'Home', price: 20.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Meat+Thermometer', description: 'Ensure perfectly cooked meats every time with instant read.', brand: 'ThermoCook', variant: 'Instant Read' },
    { id: 'h015', name: 'Slow Cooker Large Capacity', category: 'Home', price: 55.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Slow+Cooker', description: 'Prepare delicious, tender meals with minimal effort.', brand: 'CrockPot', variant: '6-Quart' },
    { id: 'h016', name: 'Indoor Plant Pot Set', category: 'Home', price: 40.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Plant+Pots', description: 'Stylish ceramic pots to enhance your indoor garden.', brand: 'GreenThumb', variant: 'Set of 3' },
    { id: 'h017', name: 'Electric Kettle Fast Boil', category: 'Home', price: 45.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Electric+Kettle', description: 'Boil water quickly and safely for tea, coffee, and more.', brand: 'RapidBoil', variant: '1.7L' },
    { id: 'h018', name: 'Handheld Garment Steamer', category: 'Home', price: 35.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Garment+Steamer', description: 'Quickly de-wrinkle clothes for a fresh look.', brand: 'SmoothFlow', variant: 'Portable' },
    { id: 'h019', name: 'Rechargeable LED Lantern', category: 'Home', price: 28.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=LED+Lantern', description: 'Portable and bright lighting for power outages or camping.', brand: 'BrightLite', variant: 'Dimmable' },
    { id: 'h020', name: 'Memory Foam Pillow', category: 'Home', price: 50.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Memory+Foam+Pillow', description: 'Ergonomic pillow for comfortable and supportive sleep.', brand: 'DreamCloud', variant: 'Standard' },

    // Books - 20 products
    { id: 'b001', name: 'The Silent Patient', category: 'Books', price: 15.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Silent+Patient', description: 'A shocking psychological thriller with a brilliant twist.', brand: 'Celadon Books', variant: 'Hardcover' },
    { id: 'b002', name: 'Atomic Habits', category: 'Books', price: 22.50, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Atomic+Habits', description: 'An easy & proven way to build good habits & break bad ones.', brand: 'Avery', variant: 'Paperback' },
    { id: 'b003', name: 'Where the Crawdads Sing', category: 'Books', price: 16.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Crawdads+Sing', description: 'A captivating mystery and coming-of-age story.', brand: 'G.P. Putnam\'s Sons', variant: 'Paperback' },
    { id: 'b004', name: 'Dune', category: 'Books', price: 14.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Dune', description: 'The seminal science fiction epic of a desert planet and its messiah.', brand: 'Ace Books', variant: 'Paperback' },
    { id: 'b005', name: 'The Midnight Library', category: 'Books', price: 17.50, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Midnight+Library', description: 'A heartwarming and philosophical tale about life choices.', brand: 'Viking', variant: 'Hardcover' },
    { id: 'b006', name: 'Becoming', category: 'Books', price: 20.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Becoming', description: 'Michelle Obama\'s intimate, powerful, and inspiring memoir.', brand: 'Crown', variant: 'Hardcover' },
    { id: 'b007', name: 'Educated', category: 'Books', price: 18.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Educated', description: 'A memoir of a young girl who pursued knowledge despite a tyrannical father.', brand: 'Random House', variant: 'Paperback' },
    { id: 'b008', name: 'Sapiens: A Brief History of Humankind', category: 'Books', price: 25.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Sapiens', description: 'A sweeping history of Homo sapiens from the Stone Age to the present.', brand: 'Harper Perennial', variant: 'Paperback' },
    { id: 'b009', name: 'The Great Gatsby', category: 'Books', price: 12.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Gatsby', description: 'A classic novel of the Jazz Age, love, and the American Dream.', brand: 'Scribner', variant: 'Paperback' },
    { id: 'b010', name: 'The Alchemist', category: 'Books', price: 13.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Alchemist', description: 'An allegorical novel about a shepherd boy who journeys to find treasure.', brand: 'HarperOne', variant: 'Paperback' },
    { id: 'b011', name: 'Fahrenheit 451', category: 'Books', price: 11.50, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Fahrenheit+451', description: 'A dystopian novel about a future society where books are outlawed.', brand: 'Simon & Schuster', variant: 'Paperback' },
    { id: 'b012', name: '1984', category: 'Books', price: 10.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=1984', description: 'A classic dystopian social science fiction novel by George Orwell.', brand: 'Signet Classic', variant: 'Paperback' },
    { id: 'b013', name: 'To Kill a Mockingbird', category: 'Books', price: 14.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Mockingbird', description: 'A timeless novel about racial injustice and childhood in the American South.', brand: 'Grand Central Publishing', variant: 'Paperback' },
    { id: 'b014', name: 'The Hobbit', category: 'Books', price: 16.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=The+Hobbit', description: 'J.R.R. Tolkien\'s classic fantasy adventure novel.', brand: 'Ballantine Books', variant: 'Paperback' },
    { id: 'b015', name: 'Pride and Prejudice', category: 'Books', price: 9.50, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Pride+Prejudice', description: 'Jane Austen\'s beloved novel of manners, love, and society.', brand: 'Penguin Classics', variant: 'Paperback' },
    { id: 'b016', name: 'The Lord of the Rings', category: 'Books', price: 28.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Lord+of+Rings', description: 'The epic high-fantasy adventure by J.R.R. Tolkien.', brand: 'Houghton Mifflin Harcourt', variant: 'Box Set' },
    { id: 'b017', name: 'Gone Girl', category: 'Books', price: 15.50, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Gone+Girl', description: 'A thrilling mystery that explores the dark side of marriage.', brand: 'Broadway Books', variant: 'Paperback' },
    { id: 'b018', name: 'The Catcher in the Rye', category: 'Books', price: 10.50, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Catcher+Rye', description: 'J.D. Salinger\'s classic novel of adolescent angst and alienation.', brand: 'Little, Brown and Company', variant: 'Paperback' },
    { id: 'b019', name: 'The Road', category: 'Books', price: 13.50, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=The+Road', description: 'A post-apocalyptic novel about a father and son\'s journey.', brand: 'Vintage', variant: 'Paperback' },
    { id: 'b020', name: 'Educated', category: 'Books', price: 18.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Educated', description: 'A powerful memoir about a young girl\'s quest for knowledge.', brand: 'Random House', variant: 'Hardcover' },

    // Sports - 20 products
    { id: 's001', name: 'Yoga Mat Premium', category: 'Sports', price: 25.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Yoga+Mat', description: 'Durable and comfortable yoga mat for all your fitness needs.', brand: 'ZenFlow', variant: '6mm-Blue' },
    { id: 's002', name: 'Resistance Band Set', category: 'Sports', price: 18.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Resistance+Bands', description: 'Versatile resistance bands for full-body workouts.', brand: 'FitFlex', variant: 'Light-Heavy' },
    { id: 's003', name: 'Smart Jump Rope', category: 'Sports', price: 35.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Smart+Jump+Rope', description: 'Track your jumps and calories with this smart jump rope.', brand: 'LeapMetric', variant: 'Digital' },
    { id: 's004', name: 'Dumbbell Set Adjustable', category: 'Sports', price: 120.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Dumbbell+Set', description: 'Space-saving adjustable dumbbells for various weights.', brand: 'IronFit', variant: '5-50lbs' },
    { id: 's005', name: 'Fitness Tracker Watch', category: 'Sports', price: 80.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Fitness+Tracker', description: 'Monitor heart rate, steps, and sleep with this advanced tracker.', brand: 'PacePro', variant: 'Black' },
    { id: 's006', name: 'Cycling Helmet Aerodynamic', category: 'Sports', price: 60.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Cycling+Helmet', description: 'Lightweight and aerodynamic helmet for road cycling.', brand: 'AeroRide', variant: 'White-M' },
    { id: 's007', name: 'Basketball Official Size', category: 'Sports', price: 30.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Basketball', description: 'Durable basketball for indoor and outdoor play.', brand: 'HoopStar', variant: 'Size 7' },
    { id: 's008', name: 'Soccer Ball Training', category: 'Sports', price: 22.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Soccer+Ball', description: 'High-quality soccer ball for practice and casual games.', brand: 'KickMaster', variant: 'Size 5' },
    { id: 's009', name: 'Tennis Racket Graphite', category: 'Sports', price: 90.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Tennis+Racket', description: 'Lightweight graphite racket for enhanced power and control.', brand: 'SmashPro', variant: 'Grip 2' },
    { id: 's010', name: 'Swimming Goggles Anti-Fog', category: 'Sports', price: 15.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Swim+Goggles', description: 'Comfortable and anti-fog goggles for clear underwater vision.', brand: 'DiveClear', variant: 'Blue' },
    { id: 's011', name: 'Camping Tent 2-Person', category: 'Sports', price: 150.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Camping+Tent', description: 'Lightweight and easy-to-pitch tent for outdoor adventures.', brand: 'TrailBlazer', variant: 'Green' },
    { id: 's012', name: 'Hiking Backpack 40L', category: 'Sports', price: 70.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Hiking+Backpack', description: 'Comfortable and spacious backpack for day hikes and overnights.', brand: 'ExplorePack', variant: 'Red' },
    { id: 's013', name: 'Fishing Rod Combo', category: 'Sports', price: 55.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Fishing+Rod', description: 'Complete fishing rod and reel combo for beginners and experts.', brand: 'Angler\'s Dream', variant: 'Spinning' },
    { id: 's014', name: 'Golf Club Set Junior', category: 'Sports', price: 180.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Golf+Set+Junior', description: 'Perfect starter golf club set for aspiring young golfers.', brand: 'JuniorPro', variant: 'Ages 9-12' },
    { id: 's015', name: 'Skateboard Complete', category: 'Sports', price: 65.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Skateboard', description: 'Ready-to-ride skateboard for cruising and tricks.', brand: 'StreetGlide', variant: 'Maple Deck' },
    { id: 's016', name: 'Roller Skates Adjustable', category: 'Sports', price: 75.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Roller+Skates', description: 'Adjustable roller skates for growing feet or sharing.', brand: 'RollEasy', variant: 'Size 4-8' },
    { id: 's017', name: 'Badminton Racket Set', category: 'Sports', price: 40.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Badminton+Set', description: 'Includes rackets, shuttlecocks, and carrying case for fun games.', brand: 'ShuttlePlay', variant: '2-Player' },
    { id: 's018', name: 'Volleyball Soft Touch', category: 'Sports', price: 28.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Volleyball', description: 'Soft touch volleyball, ideal for casual play and training.', brand: 'CourtReady', variant: 'Indoor/Outdoor' },
    { id: 's019', name: 'Baseball Glove Adult', category: 'Sports', price: 50.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Baseball+Glove', description: 'Durable leather baseball glove for adult players.', brand: 'DiamondGuard', variant: '12-inch' },
    { id: 's020', name: 'Punching Bag Heavy Duty', category: 'Sports', price: 99.00, image: 'https://placehold.co/300x200/1A2A80/ffffff?text=Punching+Bag', description: 'Ideal for boxing, kickboxing, and general fitness training.', brand: 'PowerPunch', variant: '100lb' },
];

// --- Global State & DOM Elements ---
let cartItems = [];
let currentPage = 'login';
const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const categoryPage = document.getElementById('category-page');
const cartPage = document.getElementById('cart-page');
const productDetailPage = document.getElementById('product-detail-page');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const cartIconMain = document.getElementById('cart-icon');
const cartCountMain = document.getElementById('cart-count');
const cartIconCategory = document.getElementById('cart-icon-category');
const cartCountCategory = document.getElementById('cart-count-category');
const cartIconDetail = document.getElementById('cart-icon-detail');
const cartCountDetail = document.getElementById('cart-count-detail');
const categoriesContainer = document.getElementById('categories-container');
const productList = document.getElementById('product-list');
const categoryTitle = document.getElementById('category-title');
const categoryProductList = document.getElementById('category-product-list');
const backToMainBtnCategory = document.getElementById('back-to-main-btn-category');
const backToMainBtnCart = document.getElementById('back-to-main-btn-cart');
const backFromDetailBtn = document.getElementById('back-from-detail-btn');
const productDetailContent = document.getElementById('product-detail-content');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const emptyCartMessage = document.getElementById('empty-cart-message');
const cartSummary = document.getElementById('cart-summary');
const signOutBtn = document.getElementById('sign-out-btn');


// --- Utility Functions ---

function hideAllPages() {
    loginPage.classList.add('hidden');
    mainPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    cartPage.classList.add('hidden');
    productDetailPage.classList.add('hidden');
}

function showPage(pageName, options = {}) {
    hideAllPages();
    currentPage = pageName;

    let newHash = '';
    if (pageName === 'category' && options.category) {
        newHash = `category=${encodeURIComponent(options.category)}`;
    } else if (pageName === 'product-detail' && options.productId) {
        newHash = `product=${options.productId}`;
    } else if (pageName === 'cart') {
        newHash = 'cart';
    }

    if (window.location.hash.substring(1) !== newHash) {
        window.location.hash = newHash;
    }

    switch (pageName) {
        case 'login':
            loginPage.classList.remove('hidden');
            emailInput.value = '';
            passwordInput.value = '';
            loginError.classList.add('hidden');
            break;
        case 'main':
            mainPage.classList.remove('hidden');
            renderCategories();
            renderProducts(products, productList);
            updateCartCounts();
            EventTracker.track('page_view'); // Track page view
            break;
        case 'category':
            categoryPage.classList.remove('hidden');
            categoryTitle.textContent = options.category;
            const filteredProducts = products.filter(p => p.category === options.category);
            renderProducts(filteredProducts, categoryProductList);
            updateCartCounts();
            EventTracker.track('page_view'); // Track page view
            break;
        case 'cart':
            cartPage.classList.remove('hidden');
            renderCart();
            EventTracker.track('page_view'); // Track page view
            break;
        case 'product-detail':
            productDetailPage.classList.remove('hidden');
            renderProductDetail(options.productId);
            updateCartCounts();
            EventTracker.track('page_view'); // Track page view
            break;
        default:
            showPage('login');
    }
}

function renderProducts(productsToRender, container) {
    container.innerHTML = '';
    if (productsToRender.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No products found.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-white rounded-lg shadow-md p-4 flex flex-col';
        productCard.innerHTML = `
            <a href="#product=${product.id}" class="flex flex-col flex-grow text-center">
                <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover rounded-md mb-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-2 flex-grow">${product.name}</h3>
                <p class="text-gray-600 mb-3">${product.category}</p>
                <p class="text-xl font-bold text-indigo-600 mb-4">$${product.price.toFixed(2)}</p>
            </a>
            <button class="add-to-cart-btn btn-primary w-full mt-auto" data-product-id="${product.id}">Add to Cart</button>
        `;
        container.appendChild(productCard);
    });

    container.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const productId = event.target.dataset.productId;
            addToCart(productId);
        });
    });
}

function renderProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        productDetailContent.innerHTML = '<p class="text-red-500">Product not found.</p>';
        return;
    }

    // Track view_item event when product detail page is rendered
    // NOW PASSING ITEM DETAILS DIRECTLY AS TOP-LEVEL FIELDS
    EventTracker.track('view_item', {
        item: { // Match the BigQuery RECORD type for 'item'
            item_id: product.id,
            item_name: product.name,
            price: product.price, // BigQuery field is 'price', not 'item_price'
            item_category: product.category,
            // Pass the actual brand and variant from the product object if they exist, otherwise null
            item_brand: product.brand || null,
            item_varient: product.variant || null
        }
    });

    productDetailContent.innerHTML = `
        <div class="product-image-container">
            <img src="${product.image}" alt="${product.name}" class="w-full h-auto object-cover rounded-lg shadow-md">
        </div>
        <div class="product-info flex flex-col">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">${product.name}</h2>
            <p class="text-lg text-gray-600 mb-4">${product.category}</p>
            <p class="text-gray-700 text-base mb-6">${product.description}</p>
            <div class="mt-auto">
                <p class="text-3xl font-bold text-indigo-600 mb-6">$${product.price.toFixed(2)}</p>
                <button id="detail-add-to-cart-btn" class="btn-primary w-full" data-product-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `;
    // Render review section for this product
    renderReviewSection(productId);

    document.getElementById('detail-add-to-cart-btn').addEventListener('click', (event) => {
        const id = event.target.dataset.productId;
        addToCart(id);
    });
}

function renderReviewSection(productId) {
    const reviewSectionHtml = `
        <div class="col-span-full mt-8 p-6 bg-gray-50 rounded-lg shadow-sm">
            <h3 class="text-2xl font-semibold text-gray-800 mb-4">Customer Reviews</h3>
            <div id="reviews-display-area" class="space-y-4 mb-6">
                <p class="text-gray-500">No reviews yet. Be the first to review!</p>
            </div>
            <button id="view-reviews-btn" class="btn-secondary px-4 py-2 text-sm mb-6">View All Reviews</button>

            <h4 class="text-xl font-semibold text-gray-800 mb-4">Submit Your Review</h4>
            <div class="flex items-center mb-4">
                <label for="review-rating" class="mr-2 text-gray-700">Rating:</label>
                <select id="review-rating" class="p-2 border border-gray-300 rounded-md">
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </select>
            </div>
            <textarea id="review-text" class="w-full p-3 border border-gray-300 rounded-md mb-4" rows="4" placeholder="Write your review here..."></textarea>
            <button id="submit-review-btn" class="btn-primary w-full">Submit Review</button>
        </div>
    `;
    const productDetailContainer = document.getElementById('product-detail-content');
    productDetailContainer.insertAdjacentHTML('beforeend', reviewSectionHtml);

    // Event listener for submitting a review
    document.getElementById('submit-review-btn').addEventListener('click', () => {
        const rating = document.getElementById('review-rating').value;
        const reviewText = document.getElementById('review-text').value.trim();
        submitReview(productId, rating, reviewText);
    });

    // Event listener for viewing all reviews
    document.getElementById('view-reviews-btn').addEventListener('click', () => {
        renderReviews(productId);
    });
}


function submitReview(productId, rating, reviewText) {
    if (reviewText === "") {
        alertMessage("Please write your review before submitting.");
        return;
    }
    // NOW PASSING REVIEW DETAILS DIRECTLY AS TOP-LEVEL FIELDS
    console.log(`Submitting review for product ${productId}: Rating ${rating}, Review: "${reviewText}"`);
    EventTracker.track('submit_review', {
        review: { // Match the BigQuery RECORD type for 'review'
            product_id: productId,
            rating: parseInt(rating),
            review_text: reviewText,
            // viewed_reviews_count is not relevant for submit_review, set to null
            viewed_reviews_count: null
        }
    });
    alertMessage('Review submitted! (Demo)');
    // Clear form
    document.getElementById('review-rating').value = '5';
    document.getElementById('review-text').value = '';
    // Optionally re-render reviews
    // renderReviews(productId);
}

function renderReviews(productId) {
    // Mock reviews to determine count
    const mockReviews = [
        { user: 'Alice', rating: 5, text: 'Absolutely love this product! Highly recommend.', timestamp: '2025-07-20' },
        { user: 'Bob', rating: 4, text: 'Good quality, met my expectations.', timestamp: '2025-07-22' }
    ];

    // NOW PASSING PRODUCT ID AND VIEWED REVIEWS COUNT DIRECTLY
    console.log(`Fetching reviews for product ${productId}`);
    EventTracker.track('view_reviews', {
        review: { // Match the BigQuery RECORD type for 'review'
            product_id: productId,
            // Populate viewed_reviews_count with the number of mock reviews
            viewed_reviews_count: mockReviews.length,
            // Other review fields not relevant for view_reviews, set to null
            rating: null,
            review_text: null
        }
    });

    const reviewsDisplayArea = document.getElementById('reviews-display-area');
    reviewsDisplayArea.innerHTML = ''; // Clear previous reviews

    if (mockReviews.length > 0) {
        mockReviews.forEach(review => {
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'bg-white p-4 rounded-md shadow-sm border border-gray-200';
            reviewDiv.innerHTML = `
                <div class="flex items-center mb-2">
                    <span class="font-semibold text-indigo-600 mr-2">${review.user}</span>
                    <span class="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                </div>
                <p class="text-gray-700 text-sm mb-2">${review.text}</p>
                <p class="text-gray-500 text-xs text-right">Reviewed on ${review.timestamp}</p>
            `;
            reviewsDisplayArea.appendChild(reviewDiv);
        });
    } else {
        reviewsDisplayArea.innerHTML = '<p class="text-gray-500">No reviews yet. Be the first to review!</p>';
    }
}


function renderCategories() {
    categoriesContainer.innerHTML = '';
    const uniqueCategories = [...new Set(products.map(p => p.category))];

    uniqueCategories.forEach(category => {
        const button = document.createElement('a');
        button.className = 'category-button text-center';
        button.textContent = category;
        button.href = `#category=${encodeURIComponent(category)}`;
        categoriesContainer.appendChild(button);
    });
}

function addToCart(productId) {
    const existingItem = cartItems.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cartItems.push({ productId: productId, quantity: 1 });
    }
    updateCartCounts();
    alertMessage('Product added to cart!');
}

function updateCartCounts() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const counts = [cartCountMain, cartCountCategory, cartCountDetail];

    counts.forEach(countEl => {
        if (totalItems > 0) {
            countEl.textContent = totalItems;
            countEl.classList.remove('hidden');
        } else {
            countEl.classList.add('hidden');
        }
    });
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cartItems.length === 0) {
        emptyCartMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        return;
    } else {
        emptyCartMessage.classList.add('hidden');
        cartSummary.classList.remove('hidden');
    }

    cartItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm';
            cartItemDiv.innerHTML = `
                <div class="flex items-center">
                    <img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded-md mr-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${product.name}</h3>
                        <p class="text-gray-600">Quantity: ${item.quantity}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-md font-bold text-indigo-600">$${itemTotal.toFixed(2)}</p>
                    <button class="remove-from-cart-btn text-red-500 hover:text-red-700 text-sm mt-1" data-product-id="${product.id}">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        }
    });

    cartTotalSpan.textContent = total.toFixed(2);

    cartItemsContainer.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            removeItemFromCart(productId);
        });
    });
}

function alertMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-transform duration-300 transform translate-x-full';
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.classList.remove('translate-x-full');
    }, 50);

    setTimeout(() => {
        messageBox.classList.add('translate-x-full');
        messageBox.addEventListener('transitionend', () => messageBox.remove());
    }, 3000);
}

function signOut() {
    cartItems = [];
    updateCartCounts();
    showPage('login');
    alertMessage('You have been signed out.');
}

function handleHashChange() {
    const hash = window.location.hash.substring(1);

    if (hash.startsWith('category=')) {
        const category = decodeURIComponent(hash.split('=')[1]);
        showPage('category', { category });
    } else if (hash.startsWith('product=')) {
        const productId = hash.split('=')[1];
        showPage('product-detail', { productId });
    } else if (hash === 'cart') {
        showPage('cart');
    } else {
        if (currentPage !== 'login') {
            showPage('main');
        }
    }
    EventTracker.track('page_view'); // Track page view
}

// --- Event Listeners ---
loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (email && password) {
        loginError.classList.add('hidden');
        showPage('main');
    } else {
        loginError.classList.remove('hidden');
        loginError.textContent = 'Please enter both email and password.';
    }
});

[cartIconMain, cartIconCategory, cartIconDetail].forEach(icon => {
    icon.addEventListener('click', () => showPage('cart'));
});

backToMainBtnCategory.addEventListener('click', () => showPage('main'));
backToMainBtnCart.addEventListener('click', () => showPage('main'));
backFromDetailBtn.addEventListener('click', () => window.history.back());

checkoutBtn.addEventListener('click', () => {
    if (cartItems.length > 0) {
        alertMessage('Proceeding to checkout! (This is a demo)');
        cartItems = [];
        updateCartCounts();
        renderCart();
    } else {
        alertMessage('Your cart is empty!');
    }
});

if (signOutBtn) {
    signOutBtn.addEventListener('click', signOut);
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('popstate', handleHashChange);

// --- Initial Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Track view_promotion when promo banners are clicked
    document.querySelectorAll('.promo-banner').forEach(banner => {
        banner.addEventListener('click', () => {
            // NOW PASSING PROMOTION DETAILS DIRECTLY
            const promotionId = banner.alt;
            const promotionName = banner.dataset.promotionName || null; // Get from data-attribute
            const creativeSlot = banner.dataset.creativeSlot || null;   // Get from data-attribute

            EventTracker.track('view_promotion', {
                promotion: { // Match BigQuery RECORD type for 'promotion'
                    promotion_id: promotionId,
                    promotion_name: promotionName,
                    creative_slot: creativeSlot
                }
            });
        });
    });

    if (window.location.hash) {
        handleHashChange();
    } else {
        showPage('login');
    }
});