// ==========================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================
const SUPABASE_URL = 'https://emedutxubsqpjcwuqabs.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_qoZAxsELwapEaHjaQsalcw_IYnwg43n';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let productosGlobal = []; // Almacena todos los productos de la BD
let carrito = {};         // Almacena los productos seleccionados { id: cantidad }

// Función auxiliar para formatear números como moneda
function formatearPrecio(valor) {
    return Number(valor).toLocaleString('es-CO', {
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2  
    });
}

// ==========================================
// 2. OPERACIONES CRUD (BASE DE DATOS)
// ==========================================

// LEER (Read)
async function cargarProductos() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error al cargar:', error);
        alert('Error al cargar productos: ' + error.message);
        return;
    }

    productosGlobal = data;
    renderizarAdmin(data);
    renderizarConsulta(data);
}

// CREAR o ACTUALIZAR (Create/Update)
async function crearProducto() {
    const nombre = document.getElementById('nombreInput').value;
    const precio = parseFloat(document.getElementById('precioInput').value);
    const id = document.getElementById('productoId').value;

    if (!nombre || isNaN(precio)) {
        alert('Por favor, completa ambos campos.');
        return;
    }

    if (id) {
        const { error } = await supabaseClient
            .from('productos')
            .update({ nombre, precio })
            .eq('id', id);
        if (error) alert('Error al actualizar: ' + error.message);
    } else {
        const { error } = await supabaseClient
            .from('productos')
            .insert([{ nombre, precio }]);
        if (error) alert('Error al crear: ' + error.message);
    }

    // Limpiar formulario y recargar
    document.getElementById('nombreInput').value = '';
    document.getElementById('precioInput').value = '';
    document.getElementById('productoId').value = '';
    document.getElementById('buscarAdminInput').value = '';
    cargarProductos();
}

// Preparar edición
function prepararEdicion(id, nombre, precio) {
    document.getElementById('productoId').value = id;
    document.getElementById('nombreInput').value = nombre;
    document.getElementById('precioInput').value = precio;

    document.getElementById('buscarAdminInput').value = '';
    renderizarAdmin(productosGlobal);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('nombreInput').focus();
}

// ELIMINAR (Delete)
async function eliminarProducto(id) {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    
    const { error } = await supabaseClient
        .from('productos')
        .delete()
        .eq('id', id);
    
    if (error) alert('Error al eliminar: ' + error.message);
    document.getElementById('buscarAdminInput').value = '';
    cargarProductos();
}

// ==========================================
// 3. RENDERIZADO Y FILTROS (INTERFAZ)
// ==========================================

function renderizarAdmin(productos) {
    const contenedor = document.getElementById('listaAdmin');
    contenedor.innerHTML = '';
    productos.forEach(p => {
        contenedor.innerHTML += `
            <div class="producto-item">
                <span>${p.nombre} - <span class="precio">$${formatearPrecio(p.precio)}</span></span>
                <div class="acciones-container">
                    <button class="btn-accion btn-editar" onclick="prepararEdicion(${p.id}, '${p.nombre}', ${p.precio})">Editar</button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar</button>
                </div>
            </div>
        `;
    });
}

function renderizarConsulta(productos) {
    const contenedor = document.getElementById('listaConsulta');
    contenedor.innerHTML = '';
    productos.forEach(p => {
        contenedor.innerHTML += `
            <div class="producto-item">
                <span>${p.nombre}</span>
                <span class="precio">$${formatearPrecio(p.precio)}</span>
            </div>
        `;
    });
}

function filtrarProductos() {
    const texto = document.getElementById('buscarInput').value.toLowerCase();
    document.getElementById('btnLimpiarConsulta').style.display = texto.length > 0 ? 'flex' : 'none';

    const filtrados = productosGlobal.filter(p => 
        p.nombre.toLowerCase().includes(texto)
    );
    renderizarConsulta(filtrados);
}

function filtrarAdmin() {
    const texto = document.getElementById('buscarAdminInput').value.toLowerCase();
    const filtrados = productosGlobal.filter(p => 
        p.nombre.toLowerCase().includes(texto)
    );
    renderizarAdmin(filtrados);
}

function limpiarBuscador(idInput, idBoton) {
    const input = document.getElementById(idInput);
    const boton = document.getElementById(idBoton);
    
    input.value = '';
    boton.style.display = 'none';
    
    renderizarConsulta(productosGlobal);
    input.focus();
}

// ==========================================
// 4. CONTROL DE PESTAÑAS
// ==========================================

function cambiarPestana(nombrePestana, botonClickeado) {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('seccion-' + nombrePestana).classList.add('active');
    botonClickeado.classList.add('active');

    // Si entramos al carrito, lo actualizamos
    if (nombrePestana === 'carrito') {
        renderizarCarrito();
    }
}

// ==========================================
// 5. LÓGICA DEL CARRITO / COTIZADOR
// ==========================================

function filtrarCarrito() {
    const texto = document.getElementById('buscarCarritoInput').value.toLowerCase();
    const contenedor = document.getElementById('resultadosBusquedaCarrito');
    
    document.getElementById('btnLimpiarCarrito').style.display = texto.length > 0 ? 'flex' : 'none';

    if (texto.length === 0) {
        contenedor.innerHTML = '';
        return;
    }

    const filtrados = productosGlobal.filter(p => 
        p.nombre.toLowerCase().includes(texto) && !carrito[p.id]
    );

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p style="color: #888; font-size: 0.9rem;">No se encontraron productos con ese nombre.</p>';
        return;
    }

    contenedor.innerHTML = filtrados.map(p => `
        <div class="producto-item" style="cursor: pointer; padding: 0.5rem; border-bottom: 1px solid #eee; border-radius: 4px; transition: background 0.2s;" 
             onclick="agregarAlCarrito(${p.id})" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='none'">
            <span>${p.nombre} <span style="color:#888;">($${formatearPrecio(p.precio)})</span></span>
            <span style="color: #00a8ff; font-weight: bold; font-size: 1.2rem;">+</span>
        </div>
    `).join('');
}

function agregarAlCarrito(id) {
    carrito[id] = 1; 
    document.getElementById('buscarCarritoInput').value = ''; 
    document.getElementById('resultadosBusquedaCarrito').innerHTML = ''; 
    document.getElementById('btnLimpiarCarrito').style.display = 'none'; 
    
    renderizarCarrito(); 
}

function limpiarBuscadorCarrito() {
    document.getElementById('buscarCarritoInput').value = '';
    document.getElementById('resultadosBusquedaCarrito').innerHTML = '';
    document.getElementById('btnLimpiarCarrito').style.display = 'none';
    document.getElementById('buscarCarritoInput').focus();
}

function renderizarCarrito() {
    const contenedor = document.getElementById('listaCarrito');
    contenedor.innerHTML = '';

    const idsEnCarrito = Object.keys(carrito);

    if (idsEnCarrito.length === 0) {
        contenedor.innerHTML = '<p style="color: #888;">Aún no has seleccionado ningún producto. Usa el buscador de arriba para añadirlos.</p>';
        calcularTotal();
        return;
    }

    idsEnCarrito.forEach(id => {
        const producto = productosGlobal.find(p => p.id == id);
        if (!producto) return;

        const cantidad = carrito[id];

        contenedor.innerHTML += `
            <div class="producto-item">
                <div style="flex: 1;">
                    <span style="font-weight: 500;">${producto.nombre}</span> 
                    <span style="color:#888; font-size:0.9rem;">- $${formatearPrecio(producto.precio)} c/u</span>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                    <input type="number" 
                        value="${cantidad}" 
                        min="1" 
                        onchange="cambiarCantidad(${producto.id}, this.value)"
                        style="width: 60px; text-align: center; padding: 0.3rem;">
                    
                    <button class="btn-accion btn-eliminar" onclick="quitarDelCarrito(${producto.id})" style="padding: 0.3rem 0.6rem;">Quitar</button>
                </div>
            </div>
        `;
    });

    calcularTotal();
}

function cambiarCantidad(id, nuevaCantidad) {
    const cant = parseInt(nuevaCantidad);
    if (cant > 0) {
        carrito[id] = cant;
    } else {
        delete carrito[id]; 
    }
    calcularTotal();
}

function quitarDelCarrito(id) {
    delete carrito[id];
    renderizarCarrito();
}

// CÁLCULOS FINANCIEROS (Total y Cambio)
function calcularTotal() {
    let total = 0;
    for (const id in carrito) {
        const producto = productosGlobal.find(p => p.id == id);
        if (producto) {
            total += producto.precio * carrito[id];
        }
    }
    document.getElementById('totalCarrito').textContent = '$' + formatearPrecio(total);
    
    // Si el total cambia, recalculamos el cambio automáticamente
    calcularCambio(); 
}

function calcularCambio() {
    const totalTexto = document.getElementById('totalCarrito').textContent;
    const totalLimpio = parseFloat(totalTexto.replace(/[^0-9,-]+/g,"").replace(",", ".")) || 0;
    const efectivo = parseFloat(document.getElementById('inputEfectivo').value) || 0;
    const cambio = efectivo - totalLimpio;
    const textoCambio = document.getElementById('textoCambio');

    if (efectivo === 0) {
        textoCambio.textContent = '$0';
        textoCambio.style.color = '#1a73e8'; 
    } else if (cambio < 0) {
        textoCambio.textContent = 'Falta dinero';
        textoCambio.style.color = '#dc3545'; 
    } else {
        textoCambio.textContent = '$' + formatearPrecio(cambio);
        textoCambio.style.color = '#2e7d32'; 
    }
}

function vaciarCarrito() {
    if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
        carrito = {}; 
        renderizarCarrito(); 
        
        document.getElementById('buscarCarritoInput').value = '';
        document.getElementById('resultadosBusquedaCarrito').innerHTML = '';
        document.getElementById('btnLimpiarCarrito').style.display = 'none';
        
        // Limpiamos el efectivo y el cambio
        document.getElementById('inputEfectivo').value = '';
        document.getElementById('textoCambio').textContent = '$0';
        document.getElementById('textoCambio').style.color = '#1a73e8';
    }
}

// ==========================================
// 6. INICIALIZACIÓN
// ==========================================
cargarProductos();
