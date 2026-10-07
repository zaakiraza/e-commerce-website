/**
 * Demo seed for UAT without an external DB. SQLite file (local or /tmp on Vercel) is the store;
 * this fills empty tables with realistic rows so the SPA is not blank.
 *
 * Demo logins (passwords hashed here with hashPassword — never a placeholder hash):
 * - Admin: admin@demo.local / demo-admin-password
 * - User:  user@demo.local / demo-user-password
 * - Contract login example: jane@example.com / s3cret!
 *
 * Every insert carries a fixed id and ON CONFLICT DO NOTHING, so re-seeding an
 * already-seeded database adds only what is missing and never duplicates rows.
 *
 * Set SEED_DEMO=0 to skip.
 */
import { hashPassword } from "../common/auth";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  EXAMPLE_LOGIN_EMAIL,
  EXAMPLE_LOGIN_PASSWORD,
} from "./demo-accounts";
import type { Db } from "./database";
import { cartItems, carts, orderLines, orders, productImages, products, users } from "./schema";

export async function seedDemo(db: Db): Promise<void> {
  const [adminHash, userHash, exampleHash] = await Promise.all([
    hashPassword(DEMO_ADMIN_PASSWORD),
    hashPassword(DEMO_USER_PASSWORD),
    hashPassword(EXAMPLE_LOGIN_PASSWORD),
  ]);

  const adminId = "seed-user-admin";
  const customerId = "seed-user-customer";
  const exampleUserId = "seed-user-jane";

  db.transaction((tx) => {
    tx.insert(users)
      .values([
        {
          id: adminId,
          email: DEMO_ADMIN_EMAIL,
          passwordHash: adminHash,
          role: "admin",
          fullName: "Ada Admin",
        },
        {
          id: customerId,
          email: DEMO_USER_EMAIL,
          passwordHash: userHash,
          role: "user",
          fullName: "Uma Customer",
        },
        {
          id: exampleUserId,
          email: EXAMPLE_LOGIN_EMAIL,
          passwordHash: exampleHash,
          role: "user",
          fullName: "Jane Doe",
        },
      ])
      .onConflictDoNothing()
      .run();

    tx.insert(products)
      .values([
        {
          id: "seed-product-tee",
          name: "Classic Cotton T-Shirt",
          description: "Soft pre-shrunk organic cotton tee in a regular fit.",
          price: 19.99,
          stockQuantity: 120,
        },
        {
          id: "seed-product-mug",
          name: "Ceramic Coffee Mug",
          description: "350 ml stoneware mug, dishwasher and microwave safe.",
          price: 12.5,
          stockQuantity: 80,
        },
        {
          id: "seed-product-mouse",
          name: "Wireless Ergonomic Mouse",
          description: "Silent-click wireless mouse with a 2.4 GHz USB receiver.",
          price: 29.99,
          stockQuantity: 45,
        },
        {
          id: "seed-product-tote",
          name: "Canvas Tote Bag",
          description: "Heavy-duty 16 oz canvas tote with interior pocket.",
          price: 15.0,
          stockQuantity: 60,
        },
        {
          id: "seed-product-blanket",
          name: "Linen Throw Blanket",
          description: "Washed linen throw, 130 x 180 cm. Retired for this season.",
          price: 49.0,
          stockQuantity: 0,
          isActive: false,
        },
      ])
      .onConflictDoNothing()
      .run();

    // Images have no natural key, so only products without any images get theirs.
    const imagedProductIds = new Set(
      tx.select({ productId: productImages.productId }).from(productImages).all().map((row) => row.productId),
    );
    const imageRows = [
      { id: "seed-image-tee-0", url: "https://cdn.demo.local/images/t-shirt-white.jpg", sortOrder: 0, productId: "seed-product-tee" },
      { id: "seed-image-tee-1", url: "https://cdn.demo.local/images/t-shirt-folded.jpg", sortOrder: 1, productId: "seed-product-tee" },
      { id: "seed-image-mug-0", url: "https://cdn.demo.local/images/mug-sage.jpg", sortOrder: 0, productId: "seed-product-mug" },
      { id: "seed-image-mouse-0", url: "https://cdn.demo.local/images/mouse-top.jpg", sortOrder: 0, productId: "seed-product-mouse" },
      { id: "seed-image-tote-0", url: "https://cdn.demo.local/images/tote-natural.jpg", sortOrder: 0, productId: "seed-product-tote" },
      { id: "seed-image-blanket-0", url: "https://cdn.demo.local/images/blanket-sand.jpg", sortOrder: 0, productId: "seed-product-blanket" },
    ].filter((image) => !imagedProductIds.has(image.productId));
    if (imageRows.length > 0) {
      tx.insert(productImages).values(imageRows).onConflictDoNothing().run();
    }

    tx.insert(carts)
      .values([
        { id: "seed-cart-customer", sessionId: "seed-session-customer", userId: customerId },
        { id: "seed-cart-jane", sessionId: "seed-session-jane", userId: exampleUserId },
      ])
      .onConflictDoNothing()
      .run();

    tx.insert(cartItems)
      .values([
        { id: "seed-item-customer-tee", cartId: "seed-cart-customer", productId: "seed-product-tee", quantity: 2 },
        { id: "seed-item-customer-mug", cartId: "seed-cart-customer", productId: "seed-product-mug", quantity: 1 },
        { id: "seed-item-jane-mug", cartId: "seed-cart-jane", productId: "seed-product-mug", quantity: 1 },
      ])
      .onConflictDoNothing()
      .run();

    tx.insert(orders)
      .values([
        {
          id: "seed-order-1001",
          orderNumber: "ORD-1001",
          userId: customerId,
          status: "confirmed",
          deliveryFullName: "Uma Customer",
          deliveryPhone: "+1 555 010 2030",
          deliveryStreet: "42 Maple Street",
          deliveryCity: "Springfield",
          deliveryPostalCode: "62704",
          total: 69.97,
        },
        {
          id: "seed-order-1002",
          orderNumber: "ORD-1002",
          userId: exampleUserId,
          status: "pending",
          deliveryFullName: "Jane Doe",
          deliveryPhone: "+1 555 010 4050",
          deliveryStreet: "7 Orchard Road",
          deliveryCity: "Springfield",
          deliveryPostalCode: "62711",
          total: 12.5,
        },
      ])
      .onConflictDoNothing()
      .run();

    // Order lines have no natural key either; only orders without lines get theirs.
    const linedOrderIds = new Set(
      tx.select({ orderId: orderLines.orderId }).from(orderLines).all().map((row) => row.orderId),
    );
    const lineRows = [
      {
        id: "seed-line-1001-tee",
        orderId: "seed-order-1001",
        productId: "seed-product-tee",
        productNameSnapshot: "Classic Cotton T-Shirt",
        unitPriceSnapshot: 19.99,
        quantity: 2,
        lineTotal: 39.98,
      },
      {
        id: "seed-line-1001-mouse",
        orderId: "seed-order-1001",
        productId: "seed-product-mouse",
        productNameSnapshot: "Wireless Ergonomic Mouse",
        unitPriceSnapshot: 29.99,
        quantity: 1,
        lineTotal: 29.99,
      },
      {
        id: "seed-line-1002-mug",
        orderId: "seed-order-1002",
        productId: "seed-product-mug",
        productNameSnapshot: "Ceramic Coffee Mug",
        unitPriceSnapshot: 12.5,
        quantity: 1,
        lineTotal: 12.5,
      },
    ].filter((line) => !linedOrderIds.has(line.orderId));
    if (lineRows.length > 0) {
      tx.insert(orderLines).values(lineRows).onConflictDoNothing().run();
    }
  });
}
