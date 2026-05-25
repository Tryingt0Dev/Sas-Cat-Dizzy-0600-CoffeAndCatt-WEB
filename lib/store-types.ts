export const StoreType = {
  FASHION: "ropa_y_moda",
  MARKETPLACE: "general_marketplace",
  SECURITY: "camaras_seguridad",
  SPORTS: "deportes",
  TECHNOLOGY: "tecnologia",
  FOOD: "comida_restaurante",
  BEAUTY: "belleza_cosmetica",
  HARDWARE: "ferreteria_construccion",
  SERVICES: "servicios",
  OTHER: "otro"
} as const;

export type StoreType = (typeof StoreType)[keyof typeof StoreType];

export type DynamicFieldType = "text" | "textarea" | "select" | "number" | "boolean" | "tags";

export type ProductAttributeField = {
  key: string;
  label: string;
  type: DynamicFieldType;
  placeholder?: string;
  help?: string;
  options?: string[];
};

export type StoreTypeConfig = {
  value: StoreType;
  label: string;
  description: string;
  categories: string[];
  productAttributes: ProductAttributeField[];
  onboarding: { label: string; description: string }[];
};

export const storeTypeOptions: Array<{ value: StoreType; label: string; description: string }> = [
  { value: StoreType.FASHION, label: "Ropa y moda", description: "Prendas, tallas, colores, materiales y variantes por estilo." },
  { value: StoreType.MARKETPLACE, label: "Tienda general / Marketplace", description: "Categorías flexibles, marcas, garantía y atributos de marketplace." },
  { value: StoreType.SECURITY, label: "Cámaras y seguridad", description: "Resolución, visión nocturna, conectividad y kits de vigilancia." },
  { value: StoreType.SPORTS, label: "Deportes", description: "Deporte, talla, uso recomendado y equipo deportivo especializado." },
  { value: StoreType.TECHNOLOGY, label: "Tecnología", description: "Modelo, memoria, procesador, compatibilidad y specs técnicas." },
  { value: StoreType.FOOD, label: "Comida / Restaurante", description: "Ingredientes, alérgenos, tamaños, delivery y combos." },
  { value: StoreType.BEAUTY, label: "Belleza / Cosmética", description: "Tipo de piel, ingredientes, modo de uso y beneficios." },
  { value: StoreType.HARDWARE, label: "Ferretería / Construcción", description: "Medidas, material, peso, unidades y ficha técnica." },
  { value: StoreType.SERVICES, label: "Servicios", description: "Servicios, tiempos de entrega, cobertura y modalidad." },
  { value: StoreType.OTHER, label: "Otro / Personalizado", description: "Configura campos propios según tu negocio." }
];

const storeTypeMap: Record<StoreType, StoreTypeConfig> = {
  [StoreType.FASHION]: {
    value: StoreType.FASHION,
    label: "Ropa y moda",
    description: "Atributos para prendas, tallas, colores, género y variantes." ,
    categories: ["Poleras", "Pantalones", "Vestidos", "Chaquetas", "Zapatos", "Accesorios"],
    productAttributes: [
      { key: "size", label: "Talla", type: "text", placeholder: "S, M, L, XL", help: "Define tallas disponibles o la referencia de guía de tallas." },
      { key: "color", label: "Color", type: "text", placeholder: "Negro, rojo, azul", help: "Color principal del producto o variante." },
      { key: "gender", label: "Género", type: "select", options: ["Unisex", "Hombre", "Mujer", "Niños"], help: "Tipo de público para el producto." },
      { key: "material", label: "Material", type: "text", placeholder: "Algodón, cuero, poliéster", help: "Material principal del producto." },
      { key: "season", label: "Temporada", type: "text", placeholder: "Verano, Invierno", help: "Temporada indicada del producto." },
      { key: "measurements", label: "Medidas", type: "text", placeholder: "Largo x ancho x alto", help: "Medidas en cm o especificaciones de ajuste." }
    ],
    onboarding: [
      { label: "Agrega tu primer producto con tallas y colores", description: "Publica prendas con atributos clave para que el cliente entienda fácil." },
      { label: "Configura una guía de tallas", description: "Ayuda a tus clientes a elegir la talla correcta y reduce devoluciones." },
      { label: "Publica categorías de moda", description: "Organiza prendas por tipo como poleras, vestidos y accesorios." }
    ]
  },
  [StoreType.MARKETPLACE]: {
    value: StoreType.MARKETPLACE,
    label: "Tienda general / Marketplace",
    description: "Categorías flexibles, marcas, condición de producto y detalles de envío.",
    categories: ["Electrónica", "Hogar", "Moda", "Deportes", "Accesorios", "Ofertas"],
    productAttributes: [
      { key: "brand", label: "Marca", type: "text", placeholder: "Ej: Samsung, Nike", help: "Marca o fabricante del producto." },
      { key: "condition", label: "Condición", type: "select", options: ["Nuevo", "Usado", "Remanufacturado"], help: "Estado del producto." },
      { key: "warranty", label: "Garantía", type: "text", placeholder: "6 meses, 1 año", help: "Cobertura de garantía del producto." },
      { key: "shipping", label: "Envío", type: "text", placeholder: "Envío gratis, solo región", help: "Información de envío o logística." },
      { key: "technicalSheet", label: "Ficha técnica", type: "textarea", placeholder: "Especificaciones técnicas clave", help: "Detalles técnicos relevantes para el cliente." }
    ],
    onboarding: [
      { label: "Crea categorías específicas", description: "Haz fácil la búsqueda de productos por tipo y marca." },
      { label: "Agrega condiciones y garantía", description: "Da confianza indicando si es nuevo o tiene garantía." },
      { label: "Usa un catálogo con varias marcas", description: "Ordena productos por marca y categoría para un marketplace más claro." }
    ]
  },
  [StoreType.SECURITY]: {
    value: StoreType.SECURITY,
    label: "Cámaras y seguridad",
    description: "Atributos técnicos para cámaras, kits, conectividad e instalación.",
    categories: ["Cámaras IP", "Cámaras WiFi", "Kits CCTV", "DVR", "NVR", "Instalación"],
    productAttributes: [
      { key: "resolution", label: "Resolución", type: "text", placeholder: "1080p, 4K", help: "Calidad de imagen que ofrece la cámara." },
      { key: "cameraType", label: "Tipo de cámara", type: "text", placeholder: "IP, bullet, domo", help: "Formato y uso del equipo." },
      { key: "nightVision", label: "Visión nocturna", type: "boolean", help: "Indica si soporta visión en la oscuridad." },
      { key: "connectivity", label: "Conectividad", type: "text", placeholder: "WiFi, POE, cable", help: "Tipo de conexión disponible." },
      { key: "storage", label: "Almacenamiento", type: "text", placeholder: "SD, NVR, Cloud", help: "Opciones de grabación y almacenamiento." },
      { key: "kitIncluded", label: "Kit incluido", type: "text", placeholder: "2 cámaras, DVR, cables", help: "Elementos incluidos en el paquete." },
      { key: "warranty", label: "Garantía", type: "text", placeholder: "1 año", help: "Política de garantía del producto." }
    ],
    onboarding: [
      { label: "Agrega productos con ficha técnica", description: "Incluye resolución, conectividad y almacenamiento para mayor confianza." },
      { label: "Publica kits y accesorios", description: "Muestra paquetes completos con cámaras, DVR y cables incluidos." },
      { label: "Describe instalación", description: "Explica si la cámara es para interior, exterior o instalación profesional." }
    ]
  },
  [StoreType.SPORTS]: {
    value: StoreType.SPORTS,
    label: "Deportes",
    description: "Deportes, talla, material, uso recomendado y nivel de rendimiento.",
    categories: ["Fútbol", "Gimnasio", "Running", "Ciclismo", "Natación", "Ropa deportiva", "Accesorios"],
    productAttributes: [
      { key: "sport", label: "Deporte", type: "text", placeholder: "Fútbol, running", help: "Destino principal del producto." },
      { key: "size", label: "Talla", type: "text", placeholder: "S, M, L, XL", help: "Talla o medida disponible." },
      { key: "color", label: "Color", type: "text", placeholder: "Negro, azul", help: "Color principal o opciones." },
      { key: "material", label: "Material", type: "text", placeholder: "Neopreno, poliéster", help: "Material del producto." },
      { key: "usage", label: "Uso recomendado", type: "text", placeholder: "Entrenamiento, competición", help: "Para qué se recomienda el producto." },
      { key: "level", label: "Nivel", type: "select", options: ["Principiante", "Intermedio", "Profesional"], help: "Nivel ideal del cliente." }
    ],
    onboarding: [
      { label: "Publica productos por deporte", description: "Organiza tus artículos según la disciplina o uso recomendado." },
      { label: "Agrega tallas y colores", description: "Muestra claramente la disponibilidad de cada variante deportiva." },
      { label: "Destaca productos para principiantes y profesionales", description: "Ayuda a cada cliente a encontrar lo que necesita." }
    ]
  },
  [StoreType.TECHNOLOGY]: {
    value: StoreType.TECHNOLOGY,
    label: "Tecnología",
    description: "Marca, modelo, memoria, procesador, compatibilidad y accesorios.",
    categories: ["Notebooks", "Celulares", "Accesorios", "Monitores", "Componentes", "Periféricos"],
    productAttributes: [
      { key: "brand", label: "Marca", type: "text", placeholder: "Sony, Apple", help: "Fabricante o marca del producto." },
      { key: "model", label: "Modelo", type: "text", placeholder: "Galaxy S, MacBook", help: "Nombre o referencia del modelo." },
      { key: "processor", label: "Procesador", type: "text", placeholder: "Intel i7, M2", help: "Procesador o chip del equipo." },
      { key: "memory", label: "Memoria", type: "text", placeholder: "8GB, 256GB", help: "RAM o almacenamiento interno." },
      { key: "compatibility", label: "Compatibilidad", type: "text", placeholder: "Windows, iOS, Android", help: "Plataformas o accesorios compatibles." },
      { key: "connectivity", label: "Conectividad", type: "text", placeholder: "WiFi, Bluetooth, USB-C", help: "Opciones de conexión disponibles." }
    ],
    onboarding: [
      { label: "Describe especificaciones clave", description: "Marca procesador, memoria y compatibilidad para clientes tecnológicos." },
      { label: "Agrega accesorios incluidos", description: "Especifica qué viene en la caja para evitar dudas." },
      { label: "Publica categorías claras", description: "Ordena equipos, celulares y accesorios por tipo." }
    ]
  },
  [StoreType.FOOD]: {
    value: StoreType.FOOD,
    label: "Comida / Restaurante",
    description: "Ingredientes, tamaños, sabores, disponibilidad y delivery.",
    categories: ["Cafés", "Bebidas", "Postres", "Combos", "Promociones", "Desayunos", "Almuerzos"],
    productAttributes: [
      { key: "ingredients", label: "Ingredientes", type: "textarea", placeholder: "Lista de ingredientes", help: "Describe ingredientes para clientes y personas con alergias." },
      { key: "allergens", label: "Alérgenos", type: "text", placeholder: "Gluten, lactosa", help: "Lista de alérgenos presentes." },
      { key: "size", label: "Tamaño", type: "text", placeholder: "Pequeño, mediano, grande", help: "Porciones o presentación disponible." },
      { key: "flavor", label: "Sabor", type: "text", placeholder: "Chocolate, vainilla", help: "Variante de sabor o estilo." },
      { key: "preparationTime", label: "Tiempo de preparación", type: "text", placeholder: "15 min", help: "Cuánto tarda en prepararse." },
      { key: "delivery", label: "Delivery", type: "boolean", help: "Disponible para delivery o solo retiro." },
      { key: "pickup", label: "Retiro", type: "boolean", help: "Disponible para retiro en local." }
    ],
    onboarding: [
      { label: "Agrega alérgenos e ingredientes", description: "Da seguridad al cliente mostrando los contenidos." },
      { label: "Publica combos y promociones", description: "Atrae con ofertas y opciones de menú agrupadas." },
      { label: "Activa delivery o retiro", description: "Deja claro cómo pueden recibir su pedido." }
    ]
  },
  [StoreType.BEAUTY]: {
    value: StoreType.BEAUTY,
    label: "Belleza / Cosmética",
    description: "Tipo de piel, ingredientes, beneficios, modo de uso y fragancia.",
    categories: ["Cuidado facial", "Maquillaje", "Perfumes", "Cuidado corporal", "Accesorios", "Promociones"],
    productAttributes: [
      { key: "skinType", label: "Tipo de piel", type: "text", placeholder: "Seca, mixta", help: "Indica para qué tipo de piel es el producto." },
      { key: "tone", label: "Tono", type: "text", placeholder: "Claro, medio", help: "Tono o color disponible." },
      { key: "fragrance", label: "Fragancia", type: "text", placeholder: "Floral, cítrico", help: "Aroma principal del producto." },
      { key: "ingredients", label: "Ingredientes", type: "textarea", placeholder: "Ingredientes activos", help: "Lista breve de ingredientes clave." },
      { key: "benefits", label: "Beneficios", type: "textarea", placeholder: "Hidratación, antiarrugas", help: "Resultados que ofrece el producto." },
      { key: "usage", label: "Modo de uso", type: "textarea", placeholder: "Aplicar sobre piel limpia", help: "Cómo usar el producto correctamente." }
    ],
    onboarding: [
      { label: "Describe beneficios y modo de uso", description: "Ayuda a tus clientes a comprender cómo usar el producto." },
      { label: "Publica tipos de piel y tonos", description: "Aclara quién puede usar cada producto." },
      { label: "Agrega ingredientes clave", description: "Muestra ingredientes y fragancias para confianza." }
    ]
  },
  [StoreType.HARDWARE]: {
    value: StoreType.HARDWARE,
    label: "Ferretería / Construcción",
    description: "Medidas, material, peso, unidades y ficha técnica.",
    categories: ["Herramientas", "Materiales", "Accesorios", "Pinturas", "Electricidad", "Seguridad"],
    productAttributes: [
      { key: "material", label: "Material", type: "text", placeholder: "Acero, madera", help: "Material principal del producto." },
      { key: "measurements", label: "Medidas", type: "text", placeholder: "50cm, 10mm", help: "Dimensiones del producto." },
      { key: "weight", label: "Peso", type: "text", placeholder: "1.2kg", help: "Peso del artículo." },
      { key: "unit", label: "Unidad de venta", type: "text", placeholder: "Por unidad, por metro", help: "Cómo se vende el producto." },
      { key: "compatibility", label: "Compatibilidad", type: "text", placeholder: "Compatible con taladro XYZ", help: "Herramientas o piezas compatibles." },
      { key: "technicalSheet", label: "Ficha técnica", type: "textarea", placeholder: "Notas técnicas o resistencia", help: "Información técnica relevante." }
    ],
    onboarding: [
      { label: "Agrega medidas y material", description: "Explica claramente qué dimensiones y material tiene cada producto." },
      { label: "Define unidades de venta", description: "Evita confusiones con ventas por unidad, metro o kilo." },
      { label: "Publica fichas técnicas", description: "Incluye datos técnicos para quienes compran por necesidad." }
    ]
  },
  [StoreType.SERVICES]: {
    value: StoreType.SERVICES,
    label: "Servicios",
    description: "Servicios, tiempos, cobertura y detalles de entrega.",
    categories: ["Consultoría", "Instalación", "Mantenimiento", "Diseño", "Capacitación"],
    productAttributes: [
      { key: "duration", label: "Duración", type: "text", placeholder: "1 hora, 2 días", help: "Cuánto tiempo toma el servicio." },
      { key: "location", label: "Cobertura", type: "text", placeholder: "Local, nacional", help: "Dónde está disponible el servicio." },
      { key: "priceType", label: "Precio por", type: "select", options: ["Hora", "Servicio", "Mes"], help: "Unidad de facturación del servicio." },
      { key: "deliverables", label: "Entregables", type: "textarea", placeholder: "Informe, instalación", help: "Qué recibe el cliente al contratar." },
      { key: "notes", label: "Notas", type: "textarea", placeholder: "Condiciones, visitas", help: "Información adicional sobre el servicio." }
    ],
    onboarding: [
      { label: "Describe el servicio y resultados", description: "Explica claramente qué recibe el cliente." },
      { label: "Define tiempos y cobertura", description: "Muestra cuánto dura y dónde está disponible." },
      { label: "Publica categorías de servicio", description: "Ordena tus servicios en bloques comprensibles." }
    ]
  },
  [StoreType.OTHER]: {
    value: StoreType.OTHER,
    label: "Otro / Personalizado",
    description: "Configura campos personalizados según tu negocio.",
    categories: ["Productos", "Servicios", "Promociones", "Novedades"],
    productAttributes: [
      { key: "featureA", label: "Atributo personalizado A", type: "text", placeholder: "Ej: Material", help: "Añade un campo relevante para tu producto." },
      { key: "featureB", label: "Atributo personalizado B", type: "text", placeholder: "Ej: Uso recomendado", help: "Otro atributo específico de tu negocio." },
      { key: "featureC", label: "Atributo personalizado C", type: "text", placeholder: "Ej: Garantía", help: "Campo libre para otra característica." }
    ],
    onboarding: [
      { label: "Define tus atributos clave", description: "Elige qué datos muestran mejor tu oferta." },
      { label: "Crea categorías personalizadas", description: "Ordena tus productos con carpetas que tengan sentido para ti." },
      { label: "Escribe descripciones claras", description: "Ayuda a los clientes a entender rápido cada producto." }
    ]
  }
};

export function getStoreTypeConfig(businessType?: string | null): StoreTypeConfig {
  if (!businessType) return storeTypeMap[StoreType.OTHER];
  return storeTypeMap[businessType as StoreType] ?? storeTypeMap[StoreType.OTHER];
}

export function getStoreTypeOptions() {
  return storeTypeOptions;
}

export function getAttributeLabels(businessType?: string | null) {
  return getStoreTypeConfig(businessType).productAttributes;
}

export function getCategorySuggestions(businessType?: string | null) {
  return getStoreTypeConfig(businessType).categories;
}

export function getOnboardingSteps(businessType?: string | null) {
  return getStoreTypeConfig(businessType).onboarding;
}

export function getStoreTypeLabel(businessType?: string | null) {
  return getStoreTypeConfig(businessType).label;
}
