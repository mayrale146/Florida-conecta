import { AppError, required, integer } from "../domain/errors.js";
export const safeUser = ({ password, ...user }) => user;
/** Use cases receive repository and security ports. No dependency on Express or SQLite. */
export class Service {
  constructor(repo, security) {
    this.repo = repo;
    this.security = security;
  }
  register(data) {
    const name = required(data.name, "Nombre", 100),
      email = required(data.email, "Correo", 150).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new AppError("El correo no es válido.");
    const password = required(data.password, "Contraseña", 128);
    if (password.length < 8)
      throw new AppError("La contraseña debe tener al menos 8 caracteres.");
    if (!data.consent)
      throw new AppError("Debes autorizar el tratamiento de tus datos.");
    if (this.repo.userByEmail(email))
      throw new AppError("Este correo ya está registrado.", 409);
    const role = data.role === "seller" ? "seller" : "buyer";
    const id = this.repo.createUser({
      name,
      email,
      password: this.security.hashPassword(password),
      role,
      phone: this.phone(data.phone),
      business: role === "seller" ? name : "",
    });
    return this.session(id);
  }
  phone(value) {
    const phone = required(value, "Teléfono", 20);
    if (!/^\+?[0-9 ()-]{7,20}$/.test(phone))
      throw new AppError("Ingresa un teléfono válido.");
    return phone;
  }
  login(data) {
    const user = this.repo.userByEmail(
      required(data.email, "Correo").toLowerCase(),
    );
    const password = required(data.password, "Contraseña", 128);
    if (
      !this.security.verifyPassword(password, user?.password) ||
      !user?.active
    )
      throw new AppError("Correo o contraseña incorrectos.", 401);
    return this.session(user.id);
  }
  session(id) {
    const token = this.security.token();
    this.repo.createSession(
      this.security.digest(token),
      id,
      Date.now() + 7 * 86400000,
    );
    return { token, user: safeUser(this.repo.userById(id)) };
  }
  authenticate(token) {
    if (!token) return null;
    const user = this.repo.sessionUser(this.security.digest(token), Date.now());
    return user ? safeUser(user) : null;
  }
  logout(token) {
    if (token) this.repo.removeSession(this.security.digest(token));
  }
  product(data, user, id) {
    if (!["seller", "admin"].includes(user.role))
      throw new AppError("Necesitas una cuenta de vendedor.", 403);
    if (id) this.owns(id, user);
    const p = {
      title: required(data.title, "Título", 120),
      description: required(data.description, "Descripción", 3000),
      category_id: integer(data.category_id, "Categoría"),
      price: integer(data.price, "Precio"),
      stock: integer(data.stock, "Unidades", 100000),
      image: data.image || "/images/campo.jpg",
      owner_id: user.id,
    };
    if (!this.repo.activeCategory(p.category_id))
      throw new AppError("Selecciona una categoría disponible.");
    if (!/^\/(images|uploads)\/[a-zA-Z0-9_.-]+$/.test(p.image))
      throw new AppError("Imagen inválida.");
    return { id: this.repo.saveProduct(p, id) };
  }
  owns(id, user) {
    const p = this.repo.productById(id);
    if (!p) throw new AppError("Publicación no encontrada.", 404);
    if (p.owner_id !== user.id && user.role !== "admin")
      throw new AppError("No puedes modificar esta publicación.", 403);
    return p;
  }
  profile(data, user) {
    this.repo.saveProfile(user.id, {
      name: required(data.name, "Nombre", 100),
      phone: this.phone(data.phone),
      sector: required(data.sector, "Sector", 100),
      business: String(data.business || "").slice(0, 120),
      bio: String(data.bio || "").slice(0, 1000),
      show_phone: data.show_phone ? 1 : 0,
      show_sector: data.show_sector ? 1 : 0,
    });
    return safeUser(this.repo.userById(user.id));
  }
}
