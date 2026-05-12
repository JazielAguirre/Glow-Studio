-- ============================================================
-- Glow Studio — Schema
-- Source of truth: docs/Script-Base-de-Datos.docx (2).pdf
-- Apply order: 001_schema.sql → 002_triggers.sql → 003_seeds.sql
-- ============================================================

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id_usuario     SERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    email          VARCHAR(150) UNIQUE NOT NULL,
    contrasena     TEXT NOT NULL,
    tipo_usuario   VARCHAR(20) DEFAULT 'cliente',
    estado         VARCHAR(20) DEFAULT 'activo', -- soft-delete flag
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: tipos_clase
-- ============================================
CREATE TABLE tipos_clase (
    id_tipo     SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    cupo_maximo INT NOT NULL CHECK (cupo_maximo > 0),
    estado      VARCHAR(20) DEFAULT 'activo'
);

-- ============================================
-- TABLA: clases
-- ============================================
CREATE TABLE clases (
    id_clase    SERIAL PRIMARY KEY,
    id_tipo     INT NOT NULL,
    fecha       DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin    TIME NOT NULL,
    estado      VARCHAR(20) DEFAULT 'activa',

    CONSTRAINT fk_tipo_clase
        FOREIGN KEY (id_tipo) REFERENCES tipos_clase(id_tipo)
        ON DELETE RESTRICT
);

-- ============================================
-- TABLA: reservas
-- ============================================
CREATE TABLE reservas (
    id_reserva    SERIAL PRIMARY KEY,
    id_usuario    INT NOT NULL,
    id_clase      INT NOT NULL,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado        VARCHAR(20) DEFAULT 'activa',

    CONSTRAINT fk_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_clase
        FOREIGN KEY (id_clase) REFERENCES clases(id_clase)
        ON DELETE RESTRICT,

    CONSTRAINT unique_reserva UNIQUE (id_usuario, id_clase)
);

-- ============================================
-- TABLA: paquetes
-- ============================================
CREATE TABLE paquetes (
    id_paquete      SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    cantidad_clases INT NOT NULL CHECK (cantidad_clases > 0),
    precio          NUMERIC(10,2) NOT NULL,
    vigencia_dias   INT NOT NULL CHECK (vigencia_dias > 0),
    estado          VARCHAR(20) DEFAULT 'activo'
);

-- ============================================
-- TABLA: usuario_paquetes
-- ============================================
CREATE TABLE usuario_paquetes (
    id_usuario_paquete SERIAL PRIMARY KEY,
    id_usuario         INT NOT NULL,
    id_paquete         INT NOT NULL,
    clases_restantes   INT NOT NULL,
    fecha_inicio       DATE NOT NULL,
    fecha_expiracion   DATE NOT NULL,
    estado             VARCHAR(20) DEFAULT 'activo',

    CONSTRAINT fk_usuario_paquete_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_usuario_paquete_paquete
        FOREIGN KEY (id_paquete) REFERENCES paquetes(id_paquete)
        ON DELETE RESTRICT
);

-- ============================================
-- TABLA: uso_paquete
-- ============================================
CREATE TABLE uso_paquete (
    id_uso             SERIAL PRIMARY KEY,
    id_usuario_paquete INT NOT NULL,
    id_reserva         INT NOT NULL,
    estado             VARCHAR(20) DEFAULT 'aplicado', -- tracks reversals

    CONSTRAINT fk_uso_paquete
        FOREIGN KEY (id_usuario_paquete) REFERENCES usuario_paquetes(id_usuario_paquete)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reserva_uso
        FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
        ON DELETE RESTRICT
);
