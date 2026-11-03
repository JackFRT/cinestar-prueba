package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Entidades :p

type Usuario struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Nombre   string `json:"nombre"`
	Email    string `gorm:"unique;not null" json:"email"`
	Password string `json:"password"`
	Rol      string `gorm:"default:'CLIENTE'" json:"rol"`
}

type Pelicula struct {
	ID             uint     `gorm:"primaryKey" json:"id"`
	CodigoPelicula string   `json:"codigoPelicula"`
	Titulo         string   `json:"titulo"`
	Genero         string   `json:"genero"`
	Duracion       string   `json:"duracion"`
	Imagen         string   `json:"imagen"`
	Horarios       []string `gorm:"serializer:json" json:"horarios"` // GORM maneja arreglos como JSON, no te olvides xd
}

type Snack struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	Nombre      string  `json:"nombre"`
	Descripcion string  `json:"descripcion"`
	Precio      float64 `json:"precio"`
	Imagen      string  `json:"imagen"`
}

// Estructura embebida para el JSON del carrito
type SnackComprado struct {
	Nombre   string  `json:"nombre"`
	Cantidad int     `json:"cantidad"`
	Precio   float64 `json:"precio"`
}

type Ticket struct {
	ID          uint            `gorm:"primaryKey" json:"id"`
	PeliculaID  string          `json:"peliculaId"`
	Horario     string          `json:"horario"`
	TotalPagado float64         `json:"totalPagado"`
	Estado      string          `gorm:"default:'PENDIENTE'" json:"estado"`
	UsuarioID   uint            `json:"usuarioId"`
	Asientos    []string        `gorm:"serializer:json" json:"asientos"`
	Snacks      []SnackComprado `gorm:"serializer:json" json:"snacks"`
}

// Permite que la conexión con React
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// función principal :P
func main() {
	dsn := "host=localhost user=postgres password=9538 dbname=postgres port=9667 sslmode=disable TimeZone=America/Lima"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Error conectando a la base de datos:", err)
	}

	db.AutoMigrate(&Usuario{}, &Pelicula{}, &Snack{}, &Ticket{})

	cargarDatosIniciales(db)

	r := gin.Default()
	r.Use(CORSMiddleware())

	api := r.Group("/api/cine")
	{
		api.GET("/peliculas", func(c *gin.Context) {
			var peliculas []Pelicula
			db.Find(&peliculas)
			c.JSON(http.StatusOK, peliculas)
		})

		api.GET("/snacks", func(c *gin.Context) {
			var snacks []Snack
			db.Find(&snacks)
			c.JSON(http.StatusOK, snacks)
		})

		api.GET("/ocupados", func(c *gin.Context) {
			peliculaId := c.Query("peliculaId")
			horario := c.Query("horario")

			var tickets []Ticket
			db.Where("pelicula_id = ? AND horario = ?", peliculaId, horario).Find(&tickets)

			var asientosOcupados []string
			for _, t := range tickets {
				asientosOcupados = append(asientosOcupados, t.Asientos...)
			}
			c.JSON(http.StatusOK, asientosOcupados)
		})

		api.POST("/registro", func(c *gin.Context) {
			var input Usuario
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"mensaje": "Datos inválidos"})
				return
			}

			var userExistente Usuario
			if result := db.Where("email = ?", input.Email).First(&userExistente); result.RowsAffected > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"mensaje": "El correo ya está registrado"})
				return
			}

			input.Rol = "CLIENTE"
			db.Create(&input)
			c.JSON(http.StatusOK, input)
		})

		api.POST("/login", func(c *gin.Context) {
			var credenciales struct {
				Email    string `json:"email"`
				Password string `json:"password"`
			}
			if err := c.ShouldBindJSON(&credenciales); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"mensaje": "Datos inválidos"})
				return
			}

			var user Usuario
			if result := db.Where("email = ? AND password = ?", credenciales.Email, credenciales.Password).First(&user); result.RowsAffected == 0 {
				c.JSON(http.StatusUnauthorized, gin.H{"mensaje": "Credenciales incorrectas"})
				return
			}
			c.JSON(http.StatusOK, user)
		})

		api.POST("/comprar", func(c *gin.Context) {
			var ticket Ticket
			if err := c.ShouldBindJSON(&ticket); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"mensaje": "Datos de compra inválidos"})
				return
			}
			ticket.Estado = "PENDIENTE"
			db.Create(&ticket)
			c.JSON(http.StatusOK, ticket)
		})

		api.GET("/mis-tickets", func(c *gin.Context) {
			usuarioId := c.Query("usuarioId")
			var tickets []Ticket
			db.Where("usuario_id = ?", usuarioId).Order("id desc").Find(&tickets)
			c.JSON(http.StatusOK, tickets)
		})

		admin := api.Group("/admin")
		{
			admin.POST("/peliculas", func(c *gin.Context) {
				var p Pelicula
				if err := c.ShouldBindJSON(&p); err == nil {
					db.Create(&p)
					c.JSON(http.StatusOK, p)
				}
			})

			admin.GET("/ventas", func(c *gin.Context) {
				var tickets []Ticket
				db.Order("id desc").Find(&tickets)
				c.JSON(http.StatusOK, tickets)
			})

			admin.DELETE("/peliculas/:id", func(c *gin.Context) {
				db.Delete(&Pelicula{}, c.Param("id"))
				c.JSON(http.StatusOK, gin.H{"mensaje": "Película eliminada"})
			})

			admin.POST("/snacks", func(c *gin.Context) {
				var s Snack
				if err := c.ShouldBindJSON(&s); err == nil {
					db.Create(&s)
					c.JSON(http.StatusOK, s)
				}
			})

			admin.DELETE("/snacks/:id", func(c *gin.Context) {
				db.Delete(&Snack{}, c.Param("id"))
				c.JSON(http.StatusOK, gin.H{"mensaje": "Snack eliminado"})
			})

			admin.POST("/validar-ticket/:id", func(c *gin.Context) {
				var ticket Ticket
				if result := db.First(&ticket, c.Param("id")); result.RowsAffected == 0 {
					c.JSON(http.StatusNotFound, gin.H{"valido": false, "mensaje": "Ticket no encontrado"})
					return
				}

				if ticket.Estado == "USADO" {
					c.JSON(http.StatusBadRequest, gin.H{"valido": false, "mensaje": "¡ATENCIÓN! Este ticket YA FUE USADO anteriormente."})
					return
				}

				ticket.Estado = "USADO"
				db.Save(&ticket)
				c.JSON(http.StatusOK, gin.H{"valido": true, "mensaje": "✅ Ticket válido. Acceso autorizado.", "ticket": ticket})
			})
		}
	}

	log.Println("🚀 Servidor Go iniciado en http://localhost:8080")
	r.Run(":8080")
}

func cargarDatosIniciales(db *gorm.DB) {
	var count int64
	db.Model(&Usuario{}).Where("email = ?", "admin@cinestar.com").Count(&count)
	if count == 0 {
		db.Create(&Usuario{Nombre: "Administrador CineStar", Email: "admin@cine.com", Password: "123", Rol: "ADMIN"})
	}

	db.Model(&Usuario{}).Where("email = ?", "cliente@correo.com").Count(&count)
	if count == 0 {
		db.Create(&Usuario{Nombre: "Juan Pérez", Email: "cliente@correo.com", Password: "123456", Rol: "CLIENTE"})
	}

	db.Model(&Snack{}).Count(&count)
	if count == 0 {
		db.Create(&Snack{Nombre: "Combo Dúo Popcorn", Descripcion: "2 Gaseosas Grandes + 1 Canchita Gigante", Precio: 28.00, Imagen: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&q=80&w=300"})
		db.Create(&Snack{Nombre: "Combo Personal Hot Dog", Descripcion: "1 Hot Dog XL + 1 Gaseosa Mediana", Precio: 19.50, Imagen: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=300"})
		db.Create(&Snack{Nombre: "Nachos con Queso", Descripcion: "Porción de Nachos crujientes con queso fundido", Precio: 15.00, Imagen: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=300"})
	}

	db.Model(&Pelicula{}).Count(&count)
	if count == 0 {
		peliculas := []Pelicula{
			{CodigoPelicula: "P01", Titulo: "Duna Parte III", Genero: "Ciencia Ficción", Duracion: "190 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4zseGZOOXXIH92mF409i1Cr4U-GiCoXYcFlwhoebvHdIeiG6Y8npTk8W&s=10", Horarios: []string{"16:00", "19:30", "22:15"}},
			{CodigoPelicula: "P02", Titulo: "Batman", Genero: "Thriller / Acción", Duracion: "115 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJB_N_-PJjVff-iEX7Jro30gP_V00CKGVxpiOaxkFTf5wgigMnDzikLyk&s=10", Horarios: []string{"15:00", "18:00", "21:00"}},
			{CodigoPelicula: "P03", Titulo: "Interestelar", Genero: "Ciencia Ficción / Drama", Duracion: "169 min", Imagen: "https://mir-s3-cdn-cf.behance.net/project_modules/hd_webp/8d8f28105415493.619ded067937d.jpg", Horarios: []string{"14:00", "17:30", "21:00"}},
			{CodigoPelicula: "P04", Titulo: "Demon Slayer: El Castillo Infinito", Genero: "Animación / Acción", Duracion: "145 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThHjc_HpPfoPiJBSEv_sZeckgUTHx8gY4_TTRg3313BQ&s=10", Horarios: []string{"13:00", "16:00", "19:00"}},
			{CodigoPelicula: "P05", Titulo: "El Conjuro", Genero: "Terror", Duracion: "112 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRltn-Bshovdo9WxKoedcTsseFwvIfYEwg6iTHyAIMnv8Vp0b6qbAmm9Ol&s=10", Horarios: []string{"16:30", "19:00", "22:00"}},
			{CodigoPelicula: "P06", Titulo: "Titanic", Genero: "Romance / Drama", Duracion: "195 min", Imagen: "https://www.mubis.es/media/users/12828/312004/poster-de-titanic-4k-y-3d-l_cover.jpg", Horarios: []string{"14:00", "18:00", "21:30"}},
			{CodigoPelicula: "P07", Titulo: "Toy Story 5", Genero: "Animación / Comedia", Duracion: "81 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPwvWqsQYTKZAPIZiXBa35PlSCeqqVVTyMd7Xlf31RQ&s=10", Horarios: []string{"13:00", "15:00", "17:00"}},
			{CodigoPelicula: "P08", Titulo: "Spider-Man: Un Nuevo Día", Genero: "Acción / Thriller", Duracion: "101 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQOeYyzrTAw7q45zWunpZYV1k0FL0c8Wmdl-U_uSGd0A&s=10", Horarios: []string{"15:30", "18:30", "21:30"}},
			{CodigoPelicula: "P09", Titulo: "Coco", Genero: "Animación / Familiar", Duracion: "105 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUnh5Msc6f1b6D-gnASCui6j-2ElPqfEAWLgWgkKS7DA&s=10", Horarios: []string{"13:30", "16:00", "18:30"}},
			{CodigoPelicula: "P10", Titulo: "El Justiciero", Genero: "Espionaje / Acción", Duracion: "163 min", Imagen: "https://m.media-amazon.com/images/M/MV5BZmM4YWNmYzYtZjFmZS00MTQ5LWExZWEtNWEzYjY4NTBmZWUzXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg", Horarios: []string{"14:30", "18:00", "21:30"}},
			{CodigoPelicula: "P11", Titulo: "A través de tu ventana", Genero: "Romance / Drama", Duracion: "123 min", Imagen: "https://hips.hearstapps.com/hmg-prod/images/a-traves-de-mi-ventana-netflix-1638373301.jpg", Horarios: []string{"14:00", "17:00", "20:00"}},
			{CodigoPelicula: "P12", Titulo: "Shin Godzilla", Genero: "Acción / Horror", Duracion: "123 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO7f2VqUdZBcu7eOnzM9nJiMld8CKbzY6BH2uUnNTS3LkLh1KbSNAE4UU&s=10", Horarios: []string{"15:00", "18:00", "21:00"}},
			{CodigoPelicula: "P13", Titulo: "Shrek 5", Genero: "Animación / Comedia", Duracion: "90 min", Imagen: "https://www.cinematerial.com/p/297x/kg5u6z3d/shrek-5-movie-poster-md.jpg?v=1740806414", Horarios: []string{"13:00", "15:30", "18:00"}},
			{CodigoPelicula: "P14", Titulo: "La Odisea", Genero: "Acción / Histórico", Duracion: "155 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTO6R4rOh-BER_XC9O6GcwT3xazWQjwid986a_Y38NtwShKSTrG0ZtERM&s=10", Horarios: []string{"14:00", "17:30", "21:00"}},
			{CodigoPelicula: "P15", Titulo: "Camino hacia el Terror", Genero: "Terror / Sobrenatural", Duracion: "86 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGhftqlC0r5Ud1W2VnhOmP2NMHcWP4IUaYeyLY4VY4XVbOrFN8jQK8L7tz&s=10", Horarios: []string{"17:00", "19:30", "22:00"}},
			{CodigoPelicula: "P16", Titulo: "Chiquito Pero Peligroso", Genero: "Comedia", Duracion: "117 min", Imagen: "https://play-lh.googleusercontent.com/LxqKKdHe7goj6v1Plh5aYl4qN-CaXmOhtsaaFx-aZLBpjd4Ds6tnpPWFN3073bBUARY", Horarios: []string{"14:30", "17:30", "20:30"}},
			{CodigoPelicula: "P17", Titulo: "Kung Fu Panda 4", Genero: "Animación / Aventura", Duracion: "92 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ57cPGvcoNpajCTFC6OoDT1nnm4whxRr4BIjbcWt5B8DxapZCQ6Om8SuM&s=10", Horarios: []string{"13:00", "15:30", "18:00"}},
			{CodigoPelicula: "P18", Titulo: "Resident Evil: Noche Cero", Genero: "Aventura / Terror", Duracion: "143 min", Imagen: "https://sm.ign.com/ign_latam/screenshot/default/whatsapp-image-2026-05-22-at-61324-pm_hskq.jpg", Horarios: []string{"14:00", "17:00", "20:30"}},
			{CodigoPelicula: "P19", Titulo: "¿Qué pasó ayer?", Genero: "Comedia", Duracion: "100 min", Imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwDgDyb6RnBxgXhs5AsViZWNSFVkUw5lc0vpXnRvlIQ_0tSv7eIKYjQW0&s=10", Horarios: []string{"15:00", "18:00", "20:30"}},
			{CodigoPelicula: "P20", Titulo: "Scary Movie 6", Genero: "Comedia", Duracion: "142 min", Imagen: "https://img.asmedia.epimg.net/resizer/v2/LSCVJYGXHBE4ZKZFUHWVVNQUYM.jpg?auth=ce9177a0f2fee6fef02ddd38a865889fe19cb6153a73fce1884a13d0a42a1e7a&width=375", Horarios: []string{"14:00", "17:00", "20:30"}},
		}
		db.Create(&peliculas)
	}
}