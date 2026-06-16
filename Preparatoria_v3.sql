DROP DATABASE IF EXISTS preparatoria;
CREATE DATABASE preparatoria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE preparatoria;

-- CICLOS ESCOLARES =====================================================
CREATE TABLE ciclos_escolares(
	id_ciclo INT AUTO_INCREMENT PRIMARY KEY,
	periodo VARCHAR(20) NOT NULL UNIQUE,
	fecha_inicio DATE NOT NULL,
	fecha_fin DATE NOT NULL,
	activo BOOLEAN DEFAULT FALSE
);

-- CAPACITACIONES =====================================================
CREATE TABLE capacitaciones(
	id_capacitacion INT AUTO_INCREMENT PRIMARY KEY,
	nombre_capacitacion VARCHAR(100) NOT NULL,
	ambito VARCHAR(100) NOT NULL
);

-- ASIGNATURAS =====================================================
CREATE TABLE asignaturas(
	id_asignatura INT AUTO_INCREMENT PRIMARY KEY,
	nombre_asignatura VARCHAR(100) NOT NULL,
	grado TINYINT NOT NULL,
	id_capacitacion INT NOT NULL,
	CONSTRAINT fk_asignatura_capacitacion FOREIGN KEY(id_capacitacion) REFERENCES capacitaciones(id_capacitacion)
);

-- USUARIOS =====================================================
CREATE TABLE usuarios(
	id_usuario INT AUTO_INCREMENT PRIMARY KEY,
	tipo ENUM('ADMIN', 'MAESTRO', 'ALUMNO') NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MAESTROS =====================================================
CREATE TABLE maestros(
	id_maestro INT AUTO_INCREMENT PRIMARY KEY,
	id_usuario INT NOT NULL UNIQUE,
	nombre_maestro VARCHAR(100) NOT NULL,
	apellido_maestro VARCHAR(100) NOT NULL,
	telefono VARCHAR(20),
	curp CHAR(18) NOT NULL UNIQUE,
	titulo VARCHAR(150),
	activo BOOLEAN DEFAULT TRUE,
	CONSTRAINT fk_maestro_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
);

-- ALUMNOS =====================================================
CREATE TABLE alumnos(
	id_alumno INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    nombre_alumno VARCHAR(100) NOT NULL,
    apellido_alumno VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    curp CHAR(18) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_alumno_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
);

-- GRUPOS =====================================================
CREATE TABLE grupos(
	id_grupo INT AUTO_INCREMENT PRIMARY KEY,
	grado TINYINT NOT NULL,
	numero_grupo VARCHAR(10) NOT NULL,
	id_capacitacion INT NOT NULL,
	id_ciclo INT NOT NULL,
	id_maestro_tutor INT NOT NULL,
	CONSTRAINT fk_grupo_capacitacion FOREIGN KEY(id_capacitacion) REFERENCES capacitaciones(id_capacitacion),
	CONSTRAINT fk_grupo_ciclo FOREIGN KEY(id_ciclo) REFERENCES ciclos_escolares(id_ciclo),
    CONSTRAINT fk_grupo_tutor FOREIGN KEY(id_maestro_tutor) REFERENCES maestros(id_maestro)
);

-- INSCRIPCIONES =====================================================
CREATE TABLE inscripciones(
	id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
	id_grupo INT NOT NULL,
	id_alumno INT NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    fecha_inscripcion DATE DEFAULT (CURRENT_DATE),
    fecha_baja DATE NULL,
    CONSTRAINT fk_inscripcion_grupo FOREIGN KEY(id_grupo) REFERENCES grupos(id_grupo),
    CONSTRAINT fk_inscripcion_alumno FOREIGN KEY(id_alumno) REFERENCES alumnos(id_alumno),
	UNIQUE(id_grupo, id_alumno)
);

-- CLASES =====================================================
CREATE TABLE clases(
	id_clase INT AUTO_INCREMENT PRIMARY KEY,
	id_grupo INT NOT NULL,
	id_asignatura INT NOT NULL,
	id_maestro INT NOT NULL,
	CONSTRAINT fk_clase_grupo FOREIGN KEY(id_grupo) REFERENCES grupos(id_grupo),
	CONSTRAINT fk_clase_asignatura FOREIGN KEY(id_asignatura) REFERENCES asignaturas(id_asignatura),
	CONSTRAINT fk_clase_maestro FOREIGN KEY(id_maestro) REFERENCES maestros(id_maestro),
	UNIQUE(id_grupo,id_asignatura)
);

-- PARCIALES =====================================================
CREATE TABLE parciales(
	id_parcial INT AUTO_INCREMENT PRIMARY KEY,
	id_clase INT NOT NULL,
	numero_parcial TINYINT NOT NULL,
    CONSTRAINT fk_parcial_clase FOREIGN KEY(id_clase) REFERENCES clases(id_clase),
	CONSTRAINT chk_numero_parcial CHECK(numero_parcial BETWEEN 1 AND 5),
    UNIQUE(id_clase,numero_parcial)
);

-- EVIDENCIAS =====================================================
CREATE TABLE evidencias(
	id_evidencia INT AUTO_INCREMENT PRIMARY KEY,
	id_clase INT NOT NULL,
	id_parcial INT NOT NULL,
	nombre_archivo VARCHAR(255),
	imagen LONGBLOB,
	fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidencia_clase FOREIGN KEY(id_clase) REFERENCES clases(id_clase),
    CONSTRAINT fk_evidencia_parcial FOREIGN KEY(id_parcial) REFERENCES parciales(id_parcial)
);

-- CALIFICACIONES =====================================================
CREATE TABLE calificaciones(
	id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_parcial INT NOT NULL,
    id_alumno INT NOT NULL,
    calificacion DECIMAL(5,2) NOT NULL,
    observaciones VARCHAR(500),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_calificacion_parcial FOREIGN KEY(id_parcial) REFERENCES parciales(id_parcial),
    CONSTRAINT fk_calificacion_alumno FOREIGN KEY(id_alumno) REFERENCES alumnos(id_alumno),
    CONSTRAINT chk_calificacion CHECK(calificacion BETWEEN 0 AND 100),
    UNIQUE(id_parcial,id_alumno)
);

-- =====================================================
-- TRIGGER VALIDAR CAPACITACIÓN
-- =====================================================
DELIMITER $$
CREATE TRIGGER tr_validar_capacitacion BEFORE INSERT ON clases FOR EACH ROW
BEGIN
	DECLARE v_cap_grupo INT;
	DECLARE v_cap_asignatura INT;
    
	SELECT id_capacitacion INTO v_cap_grupo FROM grupos WHERE id_grupo = NEW.id_grupo;
	SELECT id_capacitacion INTO v_cap_asignatura FROM asignaturas WHERE id_asignatura = NEW.id_asignatura;
    IF v_cap_grupo <> v_cap_asignatura THEN
		SIGNAL SQLSTATE '45000'
		SET MESSAGE_TEXT ='La asignatura no pertenece a la capacitacion del grupo';
	END IF;
END$$
DELIMITER;

-- =====================================================
-- PROCEDIMIENTO CREAR CUENTA
-- =====================================================
DELIMITER $$
CREATE PROCEDURE crear_cuenta(IN p_tipo VARCHAR(10), IN p_nombre VARCHAR(100), IN p_apellido VARCHAR(100), IN p_email VARCHAR(150),
	IN p_telefono VARCHAR(20), IN p_fecha_nacimiento DATE, IN p_curp CHAR(18), IN p_titulo VARCHAR(150))
BEGIN
	DECLARE v_password VARCHAR(8);
	DECLARE v_id_usuario INT;
	
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
	BEGIN
		ROLLBACK;
	END;

	START TRANSACTION;
		SET v_password='12345678';
		INSERT INTO usuarios(tipo, email, password_hash) VALUES (p_tipo, p_email, SHA2(v_password,256));
		SET v_id_usuario=LAST_INSERT_ID();

		IF p_tipo='MAESTRO' THEN
			INSERT INTO maestros(id_usuario, nombre_maestro, apellido_maestro, telefono, curp, titulo) VALUES
			(v_id_usuario, p_nombre, p_apellido, p_telefono, p_curp,p_titulo);
		ELSEIF p_tipo='ALUMNO' THEN
			INSERT INTO alumnos(id_usuario, nombre_alumno, apellido_alumno, telefono, curp, fecha_nacimiento, matricula) VALUES
			(v_id_usuario, p_nombre, p_apellido, p_telefono, p_curp, p_fecha_nacimiento, CONCAT(YEAR(CURDATE()), LPAD(FLOOR(RAND()*999999), 6, '0')));
		END IF;
	COMMIT;

	SELECT p_email AS usuario, v_password AS password_generada;
END$$
DELIMITER ;

-- =====================================================
-- PROCEDIMIENTO ACTUALIZAR CONTRASENA
-- =====================================================
DELIMITER $$
CREATE PROCEDURE actualizar_password(IN p_email VARCHAR(150), IN p_password_actual VARCHAR(255), IN p_password_nueva VARCHAR(255))
BEGIN
    DECLARE v_id_usuario INT;

    SELECT id_usuario INTO v_id_usuario FROM usuarios WHERE email=p_email AND password_hash = SHA2(p_password_actual,256) AND activo=TRUE LIMIT 1;
    IF v_id_usuario IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Correo o contraseña actual incorrectos';
	ELSE
		IF SHA2(p_password_actual,256)=SHA2(p_password_nueva,256) THEN
			SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='La nueva contraseña debe ser diferente a la actual';
		ELSE
			UPDATE usuarios SET password_hash = SHA2(p_password_nueva,256) WHERE id_usuario = v_id_usuario;
			SELECT 'Contraseña actualizada correctamente' AS mensaje;
		END IF;
    END IF;
END$$
DELIMITER ;

-- =====================================================
-- PROCEDIMIENTO PROMOVER GRUPO
-- =====================================================
DELIMITER $$
CREATE PROCEDURE promover_grupo(IN p_grupo_actual INT, IN p_grupo_nuevo INT)
BEGIN
	INSERT INTO inscripciones(id_grupo, id_alumno, estado, fecha_inscripcion)
	SELECT p_grupo_nuevo, id_alumno, 'ACTIVO', CURDATE() FROM inscripciones WHERE id_grupo=p_grupo_actual AND estado='ACTIVO';
    UPDATE inscripciones SET estado='INACTIVO', fecha_baja=CURDATE() WHERE id_grupo=p_grupo_actual AND estado='ACTIVO';
END$$
DELIMITER ;

-- =====================================================
-- VISTA ASIGNATURAS POR GRUPO
-- =====================================================
CREATE VIEW vw_asignaturas_grupo AS
SELECT g.id_grupo, a.id_asignatura, a.nombre_asignatura FROM clases c
INNER JOIN grupos g ON c.id_grupo=g.id_grupo INNER JOIN asignaturas a ON c.id_asignatura=a.id_asignatura;

-- =====================================================
-- VISTA DETALLE DE GRUPO
-- =====================================================
CREATE VIEW vw_detalle_grupo AS
SELECT g.id_grupo, CONCAT(g.grado, '° ', g.numero_grupo) AS nombre_grupo, ce.periodo, cap.nombre_capacitacion, CONCAT(m.nombre_maestro, ' ', m.apellido_maestro) 
AS nombre_tutor FROM grupos g INNER JOIN ciclos_escolares ce ON g.id_ciclo=ce.id_ciclo INNER JOIN capacitaciones cap ON g.id_capacitacion=cap.id_capacitacion
LEFT JOIN maestros m ON g.id_maestro_tutor=m.id_maestro;

-- =====================================================
-- VISTA BOLETA
-- =====================================================
CREATE VIEW vw_boleta_alumno AS 
SELECT a.id_alumno, a.matricula, CONCAT(a.nombre_alumno, ' ', a.apellido_alumno) AS alumno, g.id_grupo, CONCAT(g.grado, '° ', g.numero_grupo) AS grupo, asi.id_asignatura, asi.nombre_asignatura, 
MAX(CASE WHEN p.numero_parcial = 1 THEN cal.calificacion END) AS parcial_1, MAX(CASE WHEN p.numero_parcial = 2 THEN cal.calificacion END) AS parcial_2, 
MAX(CASE WHEN p.numero_parcial = 3 THEN cal.calificacion END) AS parcial_3, MAX(CASE WHEN p.numero_parcial = 4 THEN cal.calificacion END) AS parcial_4, 
MAX(CASE WHEN p.numero_parcial = 5 THEN cal.calificacion END) AS parcial_5, ROUND(AVG(cal.calificacion), 2) AS promedio FROM alumnos a
INNER JOIN inscripciones i ON a.id_alumno = i.id_alumno AND i.estado = 'ACTIVO' INNER JOIN grupos g ON i.id_grupo = g.id_grupo
INNER JOIN clases cl ON g.id_grupo = cl.id_grupo INNER JOIN asignaturas asi ON cl.id_asignatura = asi.id_asignatura
LEFT JOIN parciales p ON cl.id_clase = p.id_clase LEFT JOIN calificaciones cal ON p.id_parcial = cal.id_parcial AND cal.id_alumno = a.id_alumno
GROUP BY a.id_alumno, a.matricula, alumno, g.id_grupo, grupo, asi.id_asignatura, asi.nombre_asignatura ORDER BY a.id_alumno;

-- =====================================================
-- VISTA CREDENCIAL
-- =====================================================
CREATE VIEW vw_credencial_alumno AS
SELECT a.id_alumno, a.matricula, CONCAT(a.nombre_alumno, ' ', a.apellido_alumno) AS nombre_completo,
g.grado, g.numero_grupo, cap.nombre_capacitacion, DATE_ADD(CURDATE(), INTERVAL 1 YEAR) AS vigencia FROM alumnos a
INNER JOIN inscripciones i ON a.id_alumno=i.id_alumno INNER JOIN grupos g ON i.id_grupo=g.id_grupo
INNER JOIN capacitaciones cap ON g.id_capacitacion=cap.id_capacitacion WHERE i.estado='ACTIVO';

-- DATOS DE PRUEBA =====================================================
-- CICLO ESCOLAR
INSERT INTO ciclos_escolares(periodo, fecha_inicio, fecha_fin, activo) VALUES
('2025-2026', '2025-08-01', '2026-07-31', TRUE);

-- CAPACITACIONES
INSERT INTO capacitaciones(nombre_capacitacion, ambito) VALUES
('Informática', 'Tecnología'),
('Contabilidad', 'Administración');

-- ASIGNATURAS
INSERT INTO asignaturas(nombre_asignatura, grado, id_capacitacion) VALUES
-- Asignaturas de Informática
('Matemáticas I', 1, 1),
('Programación I', 1, 1),
('Ofimática', 1, 1),
-- Asignaturas de Contabilidad
('Contabilidad I', 1, 2),
('Economía', 1, 2),
('Administración', 1, 2);

-- MAESTROS 
CALL crear_cuenta('MAESTRO', 'Luis', 'García', 'luis@escuela.edu', '6531111111', '1980-01-10', 'GALL800110HSLRXX01', 'Ingniero en Sistemas');
CALL crear_cuenta('MAESTRO', 'Marta', 'López', 'marta@escuela.edu', '6532222222', '1982-02-20', 'LOPM820220HSLRXX02', 'Licenciada en Contaduría');

-- ALUMNOS
CALL crear_cuenta('ALUMNO', 'Juan', 'Pérez', 'juan1@escuela.edu', '6531000001', '2008-01-01', 'PEPJ080101HSLRXX01', NULL);
CALL crear_cuenta('ALUMNO', 'Ana', 'Ramírez', 'ana1@escuela.edu', '6531000002', '2008-01-02', 'RAMA080102HSLRXX02', NULL);
CALL crear_cuenta('ALUMNO', 'Pedro', 'Soto', 'pedro1@escuela.edu', '6531000003', '2008-01-03', 'SOTP080103HSLRXX03', NULL);
CALL crear_cuenta('ALUMNO', 'Lucía', 'Nava', 'lucia1@escuela.edu', '6531000004', '2008-01-04', 'NAVL080104HSLRXX04', NULL);
CALL crear_cuenta('ALUMNO', 'José', 'Mora', 'jose1@escuela.edu', '6531000005', '2008-01-05', 'MORJ080105HSLRXX05', NULL);
CALL crear_cuenta('ALUMNO', 'María', 'Ríos', 'maria1@escuela.edu', '6531000006', '2008-01-06', 'RIOM080106HSLRXX06', NULL);
CALL crear_cuenta('ALUMNO', 'Carlos', 'Díaz', 'carlos1@escuela.edu', '6531000007', '2008-01-07', 'DIAC080107HSLRXX07', NULL);
CALL crear_cuenta('ALUMNO', 'Elena', 'Vega', 'elena1@escuela.edu', '6531000008', '2008-01-08', 'VEGE080108HSLRXX08', NULL);
CALL crear_cuenta('ALUMNO', 'Miguel', 'Castro', 'miguel1@escuela.edu', '6531000009', '2008-01-09', 'CAMI080109HSLRXX09', NULL);
CALL crear_cuenta('ALUMNO', 'Sofía', 'Luna', 'sofia1@escuela.edu', '6531000010', '2008-01-10', 'LUSO080110HSLRXX10', NULL);

-- GRUPOS
INSERT INTO grupos(grado, numero_grupo, id_capacitacion, id_ciclo, id_maestro_tutor) VALUES
(1, 'A', 1, 1, 1),
(1, 'B', 2, 1, 2);

-- CLASES (Grupo en cierta asignatura, con cierto maestro)
INSERT INTO clases(id_grupo, id_asignatura, id_maestro) VALUES
-- Grupo 1A (Informática)
(1,1,1),
(1,2,1),
(1,3,1),
-- Grupo 1B (Contabilidad)
(2,4,2),
(2,5,2),
(2,6,2);

-- INSCRIPCIONES
INSERT INTO inscripciones(id_grupo, id_alumno) VALUES
-- Inscritos al grupo 1A
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
-- Inscritos al grupo 1B
(2, 6), (2, 7), (2, 8), (2, 9), (2, 10);

-- PARCIALES DE CADA CLASE
INSERT INTO parciales(id_clase, numero_parcial) VALUES
-- Parciales del grupo 1A
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5),
-- Parciales del grupo 1B
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5),
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5),
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5);

-- CALIFICACIONES EN CADA PARCIAL
INSERT INTO calificaciones(id_parcial, id_alumno, calificacion) VALUES
-- =====================================================
-- MATEMÁTICAS I (Clase 1 - Parciales 1-5)
-- =====================================================
(1,1,90),(1,2,80),(1,3,70),(1,4,85),(1,5,95),
(2,1,88),(2,2,82),(2,3,75),(2,4,90),(2,5,96),
(3,1,92),(3,2,85),(3,3,78),(3,4,88),(3,5,97),
(4,1,84),(4,2,86),(4,3,80),(4,4,91),(4,5,94),
(5,1,89),(5,2,83),(5,3,79),(5,4,88),(5,5,96),
-- =====================================================
-- PROGRAMACIÓN I (Clase 2 - Parciales 6-10)
-- =====================================================
(6,1,95),(6,2,87),(6,3,76),(6,4,90),(6,5,98),
(7,1,94),(7,2,88),(7,3,78),(7,4,91),(7,5,99),
(8,1,96),(8,2,89),(8,3,80),(8,4,93),(8,5,100),
(9,1,93),(9,2,86),(9,3,79),(9,4,92),(9,5,97),
(10,1,97),(10,2,90),(10,3,81),(10,4,94),(10,5,99),
-- =====================================================
-- OFIMÁTICA (Clase 3 - Parciales 11-15)
-- =====================================================
(11,1,85),(11,2,78),(11,3,72),(11,4,88),(11,5,92),
(12,1,86),(12,2,79),(12,3,73),(12,4,89),(12,5,93),
(13,1,87),(13,2,80),(13,3,74),(13,4,90),(13,5,94),
(14,1,88),(14,2,81),(14,3,75),(14,4,91),(14,5,95),
(15,1,89),(15,2,82),(15,3,76),(15,4,92),(15,5,96),
-- =====================================================
-- CONTABILIDAD I (Clase 4 - Parciales 16-20)
-- =====================================================
(16,6,80),(16,7,85),(16,8,78),(16,9,90),(16,10,95),
(17,6,81),(17,7,86),(17,8,79),(17,9,91),(17,10,96),
(18,6,82),(18,7,87),(18,8,80),(18,9,92),(18,10,97),
(19,6,83),(19,7,88),(19,8,81),(19,9,93),(19,10,98),
(20,6,84),(20,7,89),(20,8,82),(20,9,94),(20,10,99),
-- =====================================================
-- ECONOMÍA (Clase 5 - Parciales 21-25)
-- =====================================================
(21,6,75),(21,7,80),(21,8,85),(21,9,88),(21,10,92),
(22,6,76),(22,7,81),(22,8,86),(22,9,89),(22,10,93),
(23,6,77),(23,7,82),(23,8,87),(23,9,90),(23,10,94),
(24,6,78),(24,7,83),(24,8,88),(24,9,91),(24,10,95),
(25,6,79),(25,7,84),(25,8,89),(25,9,92),(25,10,96),
-- =====================================================
-- ADMINISTRACIÓN (Clase 6 - Parciales 26-30)
-- =====================================================
(26,6,82),(26,7,84),(26,8,86),(26,9,88),(26,10,90),
(27,6,83),(27,7,85),(27,8,87),(27,9,89),(27,10,91),
(28,6,84),(28,7,86),(28,8,88),(28,9,90),(28,10,92),
(29,6,85),(29,7,87),(29,8,89),(29,9,91),(29,10,93),
(30,6,86),(30,7,88),(30,8,90),(30,9,92),(30,10,94);

-- ADMINISTRADOR Y CONTRASEÑA DE PRUEBA =====================================
INSERT INTO usuarios(tipo, email, password_hash) VALUES
('ADMIN', 'admin@escuela.edu', SHA2('12345678', 256));