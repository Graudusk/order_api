INSERT INTO apikeys (email, key) VALUES ("unknown@example.com", "aaaabbbb1111");
INSERT INTO apikeys (email, key) VALUES ("known@example.com", "bbbbaaaa2222");

INSERT INTO products (productId, articleNumber, productName, productDescription, productSpecifiers, apiKey) VALUES (1, "1212-RNT", "Screw 14mm", "A mighty fine screw.", "{length : '14mm', width : '5mm'}", "aaaabbbb1111");
INSERT INTO products (productId, articleNumber, productName, productDescription, productSpecifiers, apiKey) VALUES (2, "1212-TNT", "Bolt 14mm", "A bolt that fits the mighty fine screw.", "{length : '5mm', width : '5mm'}", "aaaabbbb1111");
INSERT INTO products (productId, articleNumber, productName, productDescription, productSpecifiers, apiKey) VALUES (1, "QRT-LLL-14", "Blue yarn", "Nice quality yarn.", "{ color : 'blue', thickness : 8}", "bbbbaaaa2222");
INSERT INTO products (productId, articleNumber, productName, productDescription, productSpecifiers, apiKey) VALUES (3, "QRT-R34-14", "Red yarn", "Low qaulity yarn.", "{ color : 'red', thickness : 2}", "bbbbaaaa2222");