
var dialogProducto = document.getElementById("dlgProducto");
var dialogCategoria = document.getElementById("dlgCategoria");
var sidebar = document.getElementById("sidebar");

var productos = JSON.parse(localStorage.getItem("productos")) || [];
var categorias = JSON.parse(localStorage.getItem("categorias")) || [];

categorias = categorias.map(function(c) {
    return typeof c === "string" ? { nombre: c, imagen: "" } : c;
});

var filtroCategoria = "";

// ===== FUNCIONES GENERALES =====

function escapar(texto) {
    return String(texto == null ? "" : texto).replace(/[&<>"']/g, function(c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c];
    });
}

function guardarProductos() {
    localStorage.setItem("productos", JSON.stringify(productos));
}

function guardarCategorias() {
    localStorage.setItem("categorias", JSON.stringify(categorias));
}

function leerImagen(file, callback) {
    var reader = new FileReader();

    reader.onload = function() {
        callback(reader.result);
    };

    reader.readAsDataURL(file);
}

function exito(texto) {
    Swal.fire({
        title: "¡Correcto!",
        text: texto,
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#2563eb"
    });
}

function error(texto, destino) {
    Swal.fire({
        title: "Atención",
        text: texto,
        icon: "error",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#2563eb",
        target: destino || document.body
    });
}

function confirmar(texto) {
    return Swal.fire({
        title: "¿Estás seguro?",
        text: texto,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        reverseButtons: true
    });
}

// ===== MENÚ =====

document.getElementById("btnMenu").onclick = function() {
    sidebar.classList.toggle("d-none");
};

if (window.innerWidth < 768) {
    sidebar.classList.add("d-none");
}

function mostrarSeccion(idSeccion, idMenu) {
    document.getElementById("seccionProductos").style.display =
        idSeccion === "seccionProductos" ? "" : "none";

    document.getElementById("seccionCategorias").style.display =
        idSeccion === "seccionCategorias" ? "" : "none";

    var links = document.querySelectorAll("#sidebar .nav-link");

    for (var i = 0; i < links.length; i++) {
        links[i].classList.remove("active");
    }

    document.getElementById(idMenu).classList.add("active");

    if (window.innerWidth < 768) {
        sidebar.classList.add("d-none");
    }

    setTimeout(function() {
        if (idSeccion === "seccionProductos" &&
            $.fn.DataTable.isDataTable("#tablaProductos")) {
            $("#tablaProductos").DataTable().columns.adjust();
        }

        if (idSeccion === "seccionCategorias" &&
            $.fn.DataTable.isDataTable("#tablaCategorias")) {
            $("#tablaCategorias").DataTable().columns.adjust();
        }
    }, 100);
}

// ===== FILTROS Y CATEGORÍAS =====

function cargarFiltroCategorias() {
    var existe = false;
    var opciones = '<option value="">Todas las categorías</option>';

    for (var i = 0; i < categorias.length; i++) {
        var sel = "";

        if (categorias[i].nombre === filtroCategoria) {
            sel = "selected";
            existe = true;
        }

        opciones += '<option value="' + escapar(categorias[i].nombre) +
            '" ' + sel + '>' + escapar(categorias[i].nombre) + '</option>';
    }

    if (!existe) {
        filtroCategoria = "";
    }

    document.getElementById("filtroCategoria").innerHTML = opciones;
}

document.getElementById("filtroCategoria").onchange = function() {
    filtroCategoria = this.value;
    cargarProductos();
};

function cargarSelectCategorias(seleccionada) {
    var opciones = '<option value="" disabled ' +
        (seleccionada ? "" : "selected") +
        '>Selecciona una categoría</option>';

    for (var i = 0; i < categorias.length; i++) {
        var sel = categorias[i].nombre === seleccionada ? "selected" : "";

        opciones += '<option value="' + escapar(categorias[i].nombre) +
            '" ' + sel + '>' + escapar(categorias[i].nombre) + '</option>';
    }

    document.getElementById("categoria").innerHTML = opciones;
}

// ===== PRODUCTOS =====

function cargarProductos() {
    if ($.fn.DataTable.isDataTable("#tablaProductos")) {
        $("#tablaProductos").DataTable().destroy();
    }

    var tabla = "";

    for (var i = 0; i < productos.length; i++) {
        var p = productos[i];

        if (filtroCategoria !== "" && p.categoria !== filtroCategoria) {
            continue;
        }

        var img = "";

        if (p.imagen) {
            img = '<img src="' + escapar(p.imagen) +
                '" class="product-image" alt="Producto">';
        }

        tabla += '<tr class="text-center">' +
            '<td>' + img + '</td>' +
            '<td><strong>' + escapar(p.nombre).toUpperCase() + '</strong></td>' +
            '<td>' + escapar(p.categoria || "") + '</td>' +
            '<td data-order="' + Number(p.precio) + '">$ ' +
            parseFloat(p.precio).toFixed(2) + '</td>' +
            '<td data-order="' + Number(p.stock) + '">' +
            escapar(p.stock) + '</td>' +
            '<td>' +
            '<button class="btn-action btn-delete" onclick="eliminarProducto(' +
            i + ')" title="Eliminar"><i class="bi bi-trash3"></i></button>' +
            '<button class="btn-action btn-edit" onclick="editarProducto(' +
            i + ')" title="Editar"><i class="bi bi-pencil"></i></button>' +
            '</td></tr>';
    }

    document.getElementById("productos").innerHTML = tabla;

    $("#tablaProductos").DataTable({
        pageLength: 5,
        lengthMenu: [5, 10, 25, 50],
        autoWidth: false,
        columnDefs: [
            { orderable: false, targets: [0, 5] }
        ],
        layout: {
            topStart: {
                buttons: [
                    {
                        extend: "excelHtml5",
                        text: '<i class="bi bi-file-earmark-excel"></i> Excel',
                        title: "Productos",
                        exportOptions: { columns: [1, 2, 3, 4] }
                    },
                    {
                        extend: "pdfHtml5",
                        text: '<i class="bi bi-file-earmark-pdf"></i> PDF',
                        title: "Productos",
                        exportOptions: { columns: [1, 2, 3, 4] }
                    }
                ]
            }
        },
        language: {
            url: "https://cdn.datatables.net/plug-ins/2.1.8/i18n/es-ES.json"
        }
    });
}

function limpiarFormProducto() {
    document.getElementById("nombre").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("imagen").value = "";
    document.getElementById("posicion").value = "";

    document.getElementById("preview").src = "";
    document.getElementById("preview").style.display = "none";
}

function cerrarProducto() {
    dialogProducto.close();
}

function nuevoProducto() {
    if (categorias.length === 0) {
        error("Primero debes agregar una categoría.");
        return;
    }

    limpiarFormProducto();
    cargarSelectCategorias("");

    document.getElementById("tituloProducto").textContent = "Nuevo producto";

    dialogProducto.showModal();
}

function editarProducto(posicion) {
    var p = productos[posicion];

    limpiarFormProducto();
    cargarSelectCategorias(p.categoria);

    document.getElementById("nombre").value = p.nombre;
    document.getElementById("precio").value = p.precio;
    document.getElementById("stock").value = p.stock;
    document.getElementById("posicion").value = posicion;

    if (p.imagen) {
        document.getElementById("preview").src = p.imagen;
        document.getElementById("preview").style.display = "block";
    }

    document.getElementById("tituloProducto").textContent = "Editar producto";

    dialogProducto.showModal();
}

document.getElementById("imagen").onchange = function() {
    var file = this.files[0];

    if (file) {
        leerImagen(file, function(imagen) {
            document.getElementById("preview").src = imagen;
            document.getElementById("preview").style.display = "block";
        });
    }
};

function guardarProducto(nombre, precio, stock, categoria, posicion, imagen) {
    var producto = {
        nombre: nombre,
        precio: precio,
        stock: stock,
        categoria: categoria,
        imagen: imagen
    };

    if (posicion !== "") {
        productos[parseInt(posicion)] = producto;
    } else {
        productos.push(producto);
    }

    guardarProductos();
    dialogProducto.close();
    cargarProductos();
}

document.getElementById("btnSave").onclick = function() {
    var nombre = document.getElementById("nombre").value.trim();
    var precioTexto = document.getElementById("precio").value;
    var stockTexto = document.getElementById("stock").value;

    var precio = parseFloat(precioTexto);
    var stock = Number(stockTexto);

    var categoria = document.getElementById("categoria").value;
    var posicion = document.getElementById("posicion").value;
    var file = document.getElementById("imagen").files[0];

    if (nombre === "" || precioTexto === "" ||
        stockTexto === "" || categoria === "") {
        error("Completa todos los campos.", dialogProducto);
        return;
    }

    if (!Number.isFinite(precio) || precio < 0 ||
        !Number.isInteger(stock) || stock < 0) {
        error("Ingresa un precio y un stock válidos.", dialogProducto);
        return;
    }

    if (file) {
        leerImagen(file, function(imagen) {
            guardarProducto(nombre, precio, stock, categoria, posicion, imagen);
        });
    } else {
        var imagenActual = "";

        if (posicion !== "") {
            imagenActual = productos[parseInt(posicion)].imagen || "";
        }

        guardarProducto(nombre, precio, stock, categoria, posicion, imagenActual);
    }
};

function eliminarProducto(posicion) {
    confirmar("Se eliminará este producto del inventario.").then(function(result) {
        if (result.isConfirmed) {
            productos.splice(posicion, 1);
            guardarProductos();
            cargarProductos();
            exito("Producto eliminado correctamente.");
        }
    });
}

// ===== CATEGORÍAS =====

function cargarCategorias() {
    if ($.fn.DataTable.isDataTable("#tablaCategorias")) {
        $("#tablaCategorias").DataTable().destroy();
    }

    var tabla = "";

    for (var i = 0; i < categorias.length; i++) {
        var c = categorias[i];
        var img = "";

        if (c.imagen) {
            img = '<img src="' + escapar(c.imagen) +
                '" class="product-image" alt="Categoría">';
        }

        tabla += '<tr class="text-center">' +
            '<td>' + img + '</td>' +
            '<td><strong>' + escapar(c.nombre).toUpperCase() + '</strong></td>' +
            '<td>' +
            '<button class="btn-action btn-delete" onclick="eliminarCategoria(' +
            i + ')" title="Eliminar"><i class="bi bi-trash3"></i></button>' +
            '<button class="btn-action btn-edit" onclick="editarCategoria(' +
            i + ')" title="Editar"><i class="bi bi-pencil"></i></button>' +
            '</td></tr>';
    }

    document.getElementById("categorias").innerHTML = tabla;

    $("#tablaCategorias").DataTable({
        pageLength: 5,
        lengthMenu: [5, 10, 25, 50],
        autoWidth: false,
        columnDefs: [
            { orderable: false, targets: [0, 2] }
        ],
        layout: {
            topStart: {
                buttons: [
                    {
                        extend: "excelHtml5",
                        text: '<i class="bi bi-file-earmark-excel"></i> Excel',
                        title: "Categorias",
                        exportOptions: { columns: [1] }
                    },
                    {
                        extend: "pdfHtml5",
                        text: '<i class="bi bi-file-earmark-pdf"></i> PDF',
                        title: "Categorias",
                        exportOptions: { columns: [1] }
                    }
                ]
            }
        },
        language: {
            url: "https://cdn.datatables.net/plug-ins/2.1.8/i18n/es-ES.json"
        }
    });
}

function cerrarCategoria() {
    dialogCategoria.close();
}

function limpiarFormCategoria() {
    document.getElementById("nombreCat").value = "";
    document.getElementById("posicionCat").value = "";
    document.getElementById("imagenCat").value = "";

    document.getElementById("previewCat").src = "";
    document.getElementById("previewCat").style.display = "none";
}

function nuevaCategoria() {
    limpiarFormCategoria();

    document.getElementById("tituloCategoria").textContent = "Nueva categoría";

    dialogCategoria.showModal();
}

function editarCategoria(posicion) {
    var c = categorias[posicion];

    limpiarFormCategoria();

    document.getElementById("nombreCat").value = c.nombre;
    document.getElementById("posicionCat").value = posicion;

    if (c.imagen) {
        document.getElementById("previewCat").src = c.imagen;
        document.getElementById("previewCat").style.display = "block";
    }

    document.getElementById("tituloCategoria").textContent = "Editar categoría";

    dialogCategoria.showModal();
}

document.getElementById("imagenCat").onchange = function() {
    var file = this.files[0];

    if (file) {
        leerImagen(file, function(imagen) {
            document.getElementById("previewCat").src = imagen;
            document.getElementById("previewCat").style.display = "block";
        });
    }
};

function guardarCategoria(nombre, posicion, imagen) {
    if (posicion !== "") {
        var anterior = categorias[parseInt(posicion)].nombre;

        if (filtroCategoria === anterior) {
            filtroCategoria = nombre;
        }

        for (var j = 0; j < productos.length; j++) {
            if (productos[j].categoria === anterior) {
                productos[j].categoria = nombre;
            }
        }

        categorias[parseInt(posicion)] = {
            nombre: nombre,
            imagen: imagen
        };

        guardarProductos();

    } else {
        categorias.push({
            nombre: nombre,
            imagen: imagen
        });
    }

    guardarCategorias();

    dialogCategoria.close();

    cargarCategorias();
    cargarFiltroCategorias();
    cargarProductos();
}

document.getElementById("btnSaveCat").onclick = function() {
    var nombre = document.getElementById("nombreCat").value.trim();
    var posicion = document.getElementById("posicionCat").value;
    var file = document.getElementById("imagenCat").files[0];

    if (nombre === "") {
        error("Escribe el nombre de la categoría.", dialogCategoria);
        return;
    }

    var repetida = false;

    for (var i = 0; i < categorias.length; i++) {
        var esOtra = posicion === "" || i !== parseInt(posicion);

        if (categorias[i].nombre.toLowerCase() === nombre.toLowerCase() && esOtra) {
            repetida = true;
            break;
        }
    }

    if (repetida) {
        error("Esta categoría ya existe.", dialogCategoria);
        return;
    }

    if (file) {
        leerImagen(file, function(imagen) {
            guardarCategoria(nombre, posicion, imagen);
        });
    } else {
        var imagenActual = "";

        if (posicion !== "") {
            imagenActual = categorias[parseInt(posicion)].imagen || "";
        }

        guardarCategoria(nombre, posicion, imagenActual);
    }
};

function eliminarCategoria(posicion) {
    var nombre = categorias[posicion].nombre;

    for (var i = 0; i < productos.length; i++) {
        if (productos[i].categoria === nombre) {
            error("No puedes eliminar esta categoría porque tiene productos registrados.");
            return;
        }
    }

    confirmar("Se eliminará esta categoría.").then(function(result) {
        if (result.isConfirmed) {
            categorias.splice(posicion, 1);

            guardarCategorias();

            cargarCategorias();
            cargarFiltroCategorias();
            cargarProductos();

            exito("Categoría eliminada correctamente.");
        }
    });
}

// ===== INICIAR SISTEMA =====

guardarCategorias();
cargarCategorias();
cargarFiltroCategorias();
cargarProductos();
s