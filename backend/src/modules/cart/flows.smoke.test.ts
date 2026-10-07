// TEMPORARY smoke check of cross-module flows; deleted after running. Not part of the suite.
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "../../common/auth";
import { products, users } from "../../db/schema";
import { createTestApp, type TestApp } from "../../../test/helpers/app";

describe("storefront flows (temporary smoke)", () => {
  let t: TestApp;
  let productId: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    t = await createTestApp();
    const db = t.db;
    db.insert(users)
      .values([
        { id: "u-admin", email: "admin@x.test", passwordHash: await hashPassword("pw-admin"), role: "admin", fullName: "Ada Admin" },
        { id: "u-cust", email: "cust@x.test", passwordHash: await hashPassword("pw-cust"), role: "user", fullName: "Cust Customer" },
      ])
      .run();
    const [prod] = db
      .insert(products)
      .values({ id: "p-1", name: "Wireless Mouse", price: 19.99, stockQuantity: 5 })
      .returning()
      .all();
    productId = prod.id;
    adminToken = (await t.http.post("/auth/login").send({ email: "admin@x.test", password: "pw-admin" })).body.accessToken;
    userToken = (await t.http.post("/auth/login").send({ email: "cust@x.test", password: "pw-cust" })).body.accessToken;
  });

  afterAll(async () => {
    await t.close();
  });

  it("catalog lists and details", async () => {
    const list = await t.http.get("/products");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ id: productId, name: "Wireless Mouse", price: 19.99, primaryImage: null, inStock: true });
    const search = await t.http.get("/products").query({ q: "mouse" });
    expect(search.body).toHaveLength(1);
    const none = await t.http.get("/products").query({ q: "zzz" });
    expect(none.body).toEqual([]);
    const detail = await t.http.get(`/products/${productId}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ stockQuantity: 5, images: [], inStock: true, description: null });
    const missing = await t.http.get("/products/nope");
    expect(missing.status).toBe(404);
    expect(missing.body.error.message).toBe("Product not found");
  });

  it("guest cart via cookie, stock limits", async () => {
    const add = await t.http.post("/cart/items").send({ productId });
    expect(add.status).toBe(200);
    expect(add.body.items).toHaveLength(1);
    expect(add.body.items[0]).toMatchObject({ quantity: 1, lineTotal: 19.99, product: { id: productId, inStock: true } });
    expect(add.body.total).toBe(19.99);
    const cookie = add.headers["set-cookie"]![0].split(";")[0];

    const again = await t.http.post("/cart/items").set("Cookie", cookie).send({ productId, quantity: 2 });
    expect(again.body.items[0].quantity).toBe(3);
    expect(again.body.total).toBe(59.97);

    const tooMuch = await t.http.post("/cart/items").set("Cookie", cookie).send({ productId, quantity: 3 });
    expect(tooMuch.status).toBe(409);
    expect(tooMuch.body.error.message).toBe("Only 5 available.");

    const itemId = again.body.items[0].id;
    const patch = await t.http.patch(`/cart/items/${itemId}`).set("Cookie", cookie).send({ quantity: 2 });
    expect(patch.status).toBe(200);
    expect(patch.body.items[0].quantity).toBe(2);

    const patchTooMuch = await t.http.patch(`/cart/items/${itemId}`).set("Cookie", cookie).send({ quantity: 9 });
    expect(patchTooMuch.status).toBe(409);
    expect(patchTooMuch.body.error.message).toBe("Only 5 available.");
    const still = await t.http.get("/cart").set("Cookie", cookie);
    expect(still.body.items[0].quantity).toBe(2);

    const badItem = await t.http.delete("/cart/items/zzz").set("Cookie", cookie);
    expect(badItem.status).toBe(404);
    expect(badItem.body.error.message).toBe("Cart item not found");
  });

  it("out of stock product is rejected", async () => {
    const [oos] = t.db.insert(products).values({ name: "Empty", price: 5, stockQuantity: 0 }).returning().all();
    const res = await t.http.post("/cart/items").send({ productId: oos.id });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe("Out of stock");
    const inactive = await t.http.post("/cart/items").send({ productId: "ghost" });
    expect(inactive.status).toBe(404);
  });

  it("guest cart merges on login", async () => {
    const add = await t.http.post("/cart/items").send({ productId, quantity: 1 });
    const cookie = add.headers["set-cookie"]![0].split(";")[0];
    const login = await t.http.post("/auth/login").set("Cookie", cookie).send({ email: "cust@x.test", password: "pw-cust" });
    expect(login.status).toBe(200);
    const cart = await t.http.get("/cart").set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(cart.body.items).toHaveLength(1);
    expect(cart.body.items[0].quantity).toBeGreaterThanOrEqual(1);
    // guest session cart is gone
    const guestAfter = await t.http.get("/cart").set("Cookie", cookie);
    expect(guestAfter.body.items).toEqual([]);
  });

  it("checkout: order created, stock decremented, cart cleared, snapshots survive", async () => {
    const auth = { Authorization: `Bearer ${userToken}` };
    await t.http.post("/cart/items").set(auth).send({ productId, quantity: 2 });
    const order = await t.http.post("/orders").set(auth).send({
      deliveryFullName: "Jane Doe",
      deliveryPhone: "5551234567",
      deliveryStreet: "12 Main St",
      deliveryCity: "Springfield",
      deliveryPostalCode: "12345",
    });
    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({ status: "pending", orderNumber: expect.stringMatching(/^ORD-\d+$/) });
    expect(t.db.select().from(products).where(eq(products.id, productId)).get()?.stockQuantity).toBeLessThan(5);
    const cart = await t.http.get("/cart").set(auth);
    expect(cart.body.items).toEqual([]);

    const mine = await t.http.get("/orders").set(auth);
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0]).toMatchObject({ status: "pending", total: 59.97 });

    const detail = await t.http.get(`/orders/${order.body.id}`).set(auth);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({
      paymentMethod: "cash_on_delivery",
      deliveryCity: "Springfield",
      lines: [expect.objectContaining({ productNameSnapshot: "Wireless Mouse", quantity: 3, unitPriceSnapshot: 19.99 })],
    });

    // other customer's order is invisible
    const other = await t.http.post("/auth/login").send({ email: "admin@x.test", password: "pw-admin" });
    const asAdmin = await t.http.get(`/orders/${order.body.id}`).set("Authorization", `Bearer ${other.body.accessToken}`);
    expect(asAdmin.status).toBe(404);

    // admins cannot place storefront orders
    const blocked = await t.http.post("/orders").set("Authorization", `Bearer ${adminToken}`).send({
      deliveryFullName: "A", deliveryPhone: "1", deliveryStreet: "s", deliveryCity: "c", deliveryPostalCode: "p",
    });
    expect(blocked.status).toBe(403);

    // unauthenticated
    const anon = await t.http.get("/orders");
    expect(anon.status).toBe(401);
    return { orderId: order.body.id };
  });

  it("admin products CRUD", async () => {
    const auth = { Authorization: `Bearer ${adminToken}` };
    const created = await t.http.post("/admin/products").set(auth).send({
      name: "Mug",
      description: "A mug",
      price: 12.5,
      stockQuantity: 3,
      images: ["https://cdn.example.com/mug.jpg"],
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "Mug", price: 12.5, stockQuantity: 3, isActive: true, images: ["https://cdn.example.com/mug.jpg"] });
    expect(created.body.id).toBeTruthy();

    const invalid = await t.http.post("/admin/products").set(auth).send({ name: "", price: -1, stockQuantity: -2, images: [] });
    expect(invalid.status).toBe(400);
    expect(JSON.stringify(invalid.body.error.details)).toContain("Name is required.");
    expect(JSON.stringify(invalid.body.error.details)).toContain("Price must be greater than 0.");

    const updated = await t.http.patch(`/admin/products/${created.body.id}`).set(auth).send({ price: 10, images: ["https://cdn.example.com/mug2.jpg"] });
    expect(updated.body).toMatchObject({ price: 10, images: ["https://cdn.example.com/mug2.jpg"], stockQuantity: 3 });

    const forbidden = await t.http.get("/admin/products").set("Authorization", `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.message).toBe("Unauthorized");

    const list = await t.http.get("/admin/products").set(auth);
    expect(list.body.length).toBeGreaterThanOrEqual(2);
    expect(list.body.map((p: { name: string }) => p.name)).toContain("Empty"); // inactive included

    const del = await t.http.delete(`/admin/products/${created.body.id}`).set(auth);
    expect(del.status).toBe(204);
    const gone = await t.http.get(`/products/${created.body.id}`);
    expect(gone.status).toBe(404);
    const adminStill = await t.http.get(`/admin/products/${created.body.id}`).set(auth);
    expect(adminStill.body.isActive).toBe(false);
  });

  it("admin orders list/get/status transitions", async () => {
    const auth = { Authorization: `Bearer ${adminToken}` };
    const list = await t.http.get("/admin/orders").set(auth);
    expect(list.status).toBe(200);
    const target = list.body.find((o: { orderNumber: string }) => o.orderNumber.startsWith("ORD-"));
    expect(target).toMatchObject({ customerName: "Cust Customer", status: "pending" });

    const detail = await t.http.get(`/admin/orders/${target.id}`).set(auth);
    expect(detail.status).toBe(200);
    expect(detail.body.customer).toMatchObject({ email: "cust@x.test", fullName: "Cust Customer" });
    expect(detail.body.lines.length).toBeGreaterThan(0);

    const stockBefore = t.db.select().from(products).where(eq(products.id, productId)).get()!.stockQuantity;
    const cancel = await t.http.patch(`/admin/orders/${target.id}/status`).set(auth).send({ status: "cancelled" });
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe("cancelled");
    expect(t.db.select().from(products).where(eq(products.id, productId)).get()!.stockQuantity).toBe(stockBefore + detail.body.lines[0].quantity);

    const reverse = await t.http.patch(`/admin/orders/${target.id}/status`).set(auth).send({ status: "confirmed" });
    expect(reverse.status).toBe(409);
    expect(reverse.body.error.message).toBe("This status change is not allowed.");

    const missing = await t.http.get("/admin/orders/zzz").set(auth);
    expect(missing.status).toBe(404);
    expect(missing.body.error.message).toBe("Order not found");
  });
});
