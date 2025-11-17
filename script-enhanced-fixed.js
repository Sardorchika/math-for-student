// Production API Configuration
const API_BASE = 'https://api.techdilnoza.uz/api'
const FALLBACK_API_BASE = 'https://api.techdilnoza.uz/api'

// API Connection Status for Frontend
let FRONTEND_API_STATUS = {
	main: 'unknown',
	fallback: 'unknown',
	usingDemo: false,
	lastChecked: null,
}

// Demo data for offline mode
const DEMO_MATERIALS = [
	{
		_id: 'demo1',
		section: 'lectures',
		title: 'Basic English Grammar',
		description:
			"Ingliz tili grammatikasining asoslari. Yangi boshlovchilar uchun mo'ljallangan darslik.",
		imageUrl: 'https://via.placeholder.com/300x200?text=English+Grammar',
		fileUrl: '#demo-file',
		fileName: 'english-grammar-basics.pdf',
		createdAt: '2024-11-17T10:00:00Z',
	},
	{
		_id: 'demo2',
		section: 'practicals',
		title: 'Speaking Practice Exercises',
		description:
			"Gapirish ko'nikmalarini rivojlantirish uchun amaliy mashg'ulotlar va mashqlar.",
		imageUrl: 'https://via.placeholder.com/300x200?text=Speaking+Practice',
		fileUrl: '#demo-file',
		fileName: 'speaking-exercises.docx',
		createdAt: '2024-11-16T14:30:00Z',
	},
	{
		_id: 'demo3',
		section: 'presentations',
		title: 'Business English Presentation',
		description:
			"Biznes ingliz tilida taqdimot qilish bo'yicha ko'rsatmalar va misollar.",
		imageUrl: 'https://via.placeholder.com/300x200?text=Business+English',
		fileUrl: '#demo-file',
		fileName: 'business-presentation.pptx',
		createdAt: '2024-11-15T09:15:00Z',
	},
]

const DEMO_NEWS = [
	{
		_id: 'news1',
		title: "Yangi dars materiallari qo'shildi",
		content:
			"Ingliz tili o'rganish uchun yangi materiallar va amaliy mashg'ulotlar qo'shildi. Barcha o'quvchilar uchun bepul.",
		author: 'Dilnoza Qodirova',
		date: '2024-11-17T08:00:00Z',
		createdAt: '2024-11-17T08:00:00Z',
	},
	{
		_id: 'news2',
		title: 'Online darslar boshlanadi',
		content:
			"Dekabr oyidan boshlab online ingliz tili darslari boshlanadi. Ro'yxatdan o'tish uchun bog'laning.",
		author: 'Dilnoza Qodirova',
		date: '2024-11-16T12:00:00Z',
		createdAt: '2024-11-16T12:00:00Z',
	},
]

// Enhanced function with offline demo data support
async function fetchWithFallback(endpoint, options = {}) {
	let lastError = null

	// Try main API first
	try {
		debugLog(`🔗 Trying main API: ${API_BASE}${endpoint}`)
		const response = await fetch(`${API_BASE}${endpoint}`, options)
		if (response.ok) {
			return response
		}
		throw new Error(
			`Main API failed: ${response.status} ${response.statusText}`
		)
	} catch (error) {
		debugLog(`❌ Main API failed: ${error.message}`)
		lastError = error
	}

	// Try fallback API if main fails
	try {
		debugLog(`🔗 Trying fallback API: ${FALLBACK_API_BASE}${endpoint}`)
		const response = await fetch(`${FALLBACK_API_BASE}${endpoint}`, options)
		if (response.ok) {
			debugLog(`✅ Fallback API successful`)
			return response
		}
		throw new Error(
			`Fallback API failed: ${response.status} ${response.statusText}`
		)
	} catch (fallbackError) {
		debugLog(`❌ Fallback API also failed: ${fallbackError.message}`)
	}

	// If both APIs fail, try demo data for GET requests
	if (options.method === 'GET' || !options.method) {
		debugLog(`🎭 Using offline demo data for: ${endpoint}`)
		return createDemoResponse(endpoint)
	}

	// For non-GET requests, throw the original error
	throw lastError
}

// Create mock response for demo data
function createDemoResponse(endpoint) {
	let data = null

	if (endpoint === '/materials') {
		data = DEMO_MATERIALS
	} else if (endpoint === '/news') {
		data = DEMO_NEWS
	} else if (endpoint === '/health') {
		data = {
			status: 'DEMO MODE',
			message: 'Using offline demo data',
			timestamp: new Date().toISOString(),
		}
	} else {
		throw new Error('No demo data available for this endpoint')
	}

	return Promise.resolve({
		ok: true,
		status: 200,
		json: () => Promise.resolve(data),
		text: () => Promise.resolve(JSON.stringify(data)),
	})
}

// Test API connectivity for frontend
async function testFrontendAPIConnectivity() {
	console.group('🔧 Frontend API Connectivity Test')

	try {
		const response = await fetch(`${API_BASE}/health`, {
			method: 'GET',
			mode: 'cors',
			credentials: 'omit',
			headers: { Accept: 'application/json' },
		})

		if (response.ok) {
			FRONTEND_API_STATUS.main = 'online'
			FRONTEND_API_STATUS.usingDemo = false
			console.log('✅ Main API is online')

			// Hide demo notification if shown
			const demoNotification = document.querySelector('.notification-warning')
			if (demoNotification) {
				demoNotification.remove()
			}
		} else {
			throw new Error(`Status: ${response.status}`)
		}
	} catch (error) {
		FRONTEND_API_STATUS.main = 'offline'
		console.log('❌ Main API offline:', error.message)

		// Test fallback for development
		if (
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1'
		) {
			try {
				const fallbackResponse = await fetch(`${FALLBACK_API_BASE}/health`)
				if (fallbackResponse.ok) {
					FRONTEND_API_STATUS.fallback = 'online'
					FRONTEND_API_STATUS.usingDemo = false
					console.log('✅ Fallback API is online')
				}
			} catch (fallbackError) {
				FRONTEND_API_STATUS.fallback = 'offline'
				FRONTEND_API_STATUS.usingDemo = true
				console.log('❌ Using demo data mode')
			}
		} else {
			FRONTEND_API_STATUS.usingDemo = true
		}
	}

	FRONTEND_API_STATUS.lastChecked = new Date().toISOString()
	console.groupEnd()
}

// Debug function
function debugLog(message, data = null) {
	console.log(`🔍 [DEBUG] ${message}`, data || '')
}

// Enhanced debug function for downloads
function debugMaterialDownload(materialId, allMaterials) {
	const material = allMaterials.find(m => m._id === materialId)
	if (material) {
		console.group(`📋 Material Debug: ${material.title}`)
		console.log('🆔 ID:', materialId)
		console.log('📁 Section:', material.section)
		console.log('🔗 File URL:', material.fileUrl)
		console.log('🔑 File Key:', material.fileKey)
		console.log('📄 File Name:', material.fileName)
		console.log('📊 File Size:', material.fileSize)
		console.log('🖼️ Image URL:', material.imageUrl)
		console.log('🔑 Image Key:', material.imageKey)
		console.log('📅 Created:', material.createdAt)
		console.groupEnd()

		// Test URLs
		if (material.fileKey) {
			console.log(
				'🧪 Expected S3 URL:',
				`https://s3.twcstorage.ru/e008923b-dbcf87a4-7047-45d8-8a51-89a9793149a6/${material.fileKey}`
			)
		}
		console.log(
			'🧪 Expected API URL:',
			`${API_BASE}/materials/${materialId}/download`
		)
	} else {
		console.error('❌ Material not found:', materialId)
		console.log(
			'📋 Available materials:',
			allMaterials.map(m => ({ id: m._id, title: m.title }))
		)
	}
}

// Materials yuklab olish - Enhanced version with CORS handling
async function loadMaterials() {
	try {
		debugLog('Starting loadMaterials function')
		debugLog('API URL:', `${API_BASE}/materials`)
		debugLog('Current origin:', window.location.origin)

		// Optional server health check - skip if CORS fails
		try {
			debugLog('Testing server connection...')
			const healthResponse = await fetch(`${API_BASE}/health`, {
				method: 'GET',
				mode: 'cors',
				credentials: 'omit',
				headers: {
					'Content-Type': 'application/json',
				},
			})
			if (healthResponse.ok) {
				const healthData = await healthResponse.json()
				debugLog('Server health check passed:', healthData)
			} else {
				debugLog(
					'Health check failed, but continuing...',
					healthResponse.status
				)
			}
		} catch (healthError) {
			debugLog(
				'Health check skipped due to CORS/network error:',
				healthError.message
			)
		}

		// Now fetch materials with fallback
		debugLog('Fetching materials...')
		const res = await fetchWithFallback('/materials', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			mode: 'cors',
			credentials: 'omit',
		})

		debugLog('Materials response status:', res.status, res.statusText)
		debugLog('Response headers:', Object.fromEntries(res.headers.entries()))

		if (!res.ok) {
			throw new Error(`Materials API failed: ${res.status} ${res.statusText}`)
		}

		const materials = await res.json()
		debugLog('Raw materials from API:', materials)
		debugLog('Materials count:', materials.length)

		const container = document.getElementById('cardsContainer')
		if (!container) {
			debugLog('ERROR: cardsContainer element not found!')
			return
		}

		container.innerHTML = ''

		if (materials.length === 0) {
			debugLog('No materials found in database')
			container.innerHTML = `
                <div class="no-data glass">
                    <h3>🔍 Materiallar topilmadi</h3>
                    <p>Hozircha hech qanday material qo'shilmagan.</p>
                    <p>Admin panel orqali yangi materiallar qo'shing.</p>
                </div>
            `
			return
		}

		// Store materials globally for filtering
		allMaterials = materials
		window.allMaterials = materials // Make available globally for debugging

		// Process each material
		materials.forEach((item, index) => {
			debugLog(`Processing material ${index + 1}:`, {
				title: item.title,
				section: item.section,
				imageUrl: item.imageUrl,
				fileUrl: item.fileUrl,
				imageKey: item.imageKey,
				fileKey: item.fileKey,
			})

			// Generate proper S3 URLs - Enhanced logic
			let imageUrl = null

			// Priority: imageUrl > imageKey > no image
			if (
				item.imageUrl &&
				!item.imageUrl.includes('placeholder') &&
				!item.imageUrl.includes('example.com')
			) {
				imageUrl = item.imageUrl
				debugLog(`Using existing imageUrl:`, imageUrl)
			} else if (item.imageKey) {
				imageUrl = `https://s3.twcstorage.ru/e008923b-dbcf87a4-7047-45d8-8a51-89a9793149a6/${item.imageKey}`
				debugLog(`Generated image URL from imageKey:`, imageUrl)
			} else {
				debugLog(`No image available for material: ${item.title}`)
			}

			let fileUrl = null

			// Priority: fileUrl > fileKey > no file
			if (
				item.fileUrl &&
				!item.fileUrl.includes('placeholder') &&
				!item.fileUrl.includes('example.com')
			) {
				fileUrl = item.fileUrl
				debugLog(`Using existing fileUrl:`, fileUrl)
			} else if (item.fileKey) {
				fileUrl = `https://s3.twcstorage.ru/e008923b-dbcf87a4-7047-45d8-8a51-89a9793149a6/${item.fileKey}`
				debugLog(`Generated file URL from fileKey:`, fileUrl)
			} else {
				debugLog(`No file available for material: ${item.title}`)
			}

			// Create card element
			const card = document.createElement('div')
			card.className = 'card glass'

			// Debug image URL construction
			debugLog(`Image processing for ${item.title}:`, {
				hasImageUrl: !!imageUrl,
				hasImageKey: !!item.imageKey,
				finalImageUrl: imageUrl,
				imageKey: item.imageKey,
			})

			// Create image section using direct S3 URL (same as admin)
			let imageSection = ''
			if (imageUrl) {
				console.log(
					`🔍 [FRONTEND DEBUG] Using imageUrl for ${item.title}:`,
					imageUrl
				)

				imageSection = `
					<div class="card-image">
						<img src="${imageUrl}" 
							 alt="${item.title}" 
							 style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px 12px 0 0;" 
							 onerror="
								console.error('❌ Image load failed for ${item.title}:', '${imageUrl}');
								this.parentElement.innerHTML='<div class=\\'no-image-placeholder\\' style=\\'height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 48px; border-radius: 12px 12px 0 0; flex-direction: column;\\'>📚<br><small style=\\'font-size: 12px; margin-top: 8px;\\'>Rasm yuklanmadi</small></div>';
							 "
							 onload="console.log('✅ Image loaded successfully for ${item.title}:', '${imageUrl}')">
					</div>`
			} else {
				imageSection = `
					<div class="no-image-placeholder" style="height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 48px; border-radius: 12px 12px 0 0; flex-direction: column;">
						📚
						<small style="font-size: 12px; margin-top: 8px;">Rasm qo'shilmagan</small>
					</div>`
			}

			card.innerHTML = `
                ${imageSection}
                <div class="card-content">
                    <div class="title"><h3>${
											item.title || 'Material'
										}</h3></div>
                    <div class="desc">${
											item.description || item.desc || "Tavsif yo'q"
										}</div>
                    <div class="card-meta">
                        <span class="section-badge">${getSectionName(
													item.section
												)}</span>
                        <span class="date">${formatDate(item.createdAt)}</span>
                    </div>
                    <div class="card-actions">
                        ${
													item.fileKey || item.fileUrl
														? `<button class="btn btn-download" onclick="console.log('🖱️ Download clicked for:', '${
																item.title
														  }', 'ID:', '${item._id}'); downloadMaterial('${
																item._id || 'unknown'
														  }', '${item.title}', '${
																item.fileName || 'file'
														  }')">
                                 📥 Yuklab olish
                                 </button>`
														: '<button class="btn btn-disabled" disabled>📎 Fayl yuklanmagan</button>'
												}
                    </div>
                </div>
            `

			container.appendChild(card)
			debugLog(`Card ${index + 1} added to container`)
		})

		// Update statistics
		updateMaterialsStats(materials)

		debugLog(`✅ All ${materials.length} materials rendered successfully`)
	} catch (error) {
		debugLog('ERROR in loadMaterials:', error)
		debugLog('Error message:', error.message)
		debugLog('Error stack:', error.stack)

		const container = document.getElementById('cardsContainer')
		if (container) {
			// Check if it's a CORS error
			const isCorsError =
				error.message.includes('Failed to fetch') ||
				error.message.includes('CORS') ||
				error.message.includes('blocked by CORS policy')

			container.innerHTML = `
                <div class="error-message glass">
                    <h3>⚠️ ${
											isCorsError ? 'CORS/Aloqa Xatoligi' : 'Server Xatoligi'
										}</h3>
                    <p><strong>Xatolik:</strong> ${error.message}</p>
                    ${
											isCorsError
												? `
                    <div class="cors-help">
                        <h4>🔒 CORS Muammosi Hal Qilish:</h4>
                        <ol>
                            <li><strong>Backend serverni tekshiring:</strong> api.techdilnoza.uz ishlaydimi?</li>
                            <li><strong>CORS sozlamalari:</strong> Backend da frontend domini (${window.location.origin}) qo'shilganmi?</li>
                            <li><strong>SSL sertifikat:</strong> HTTPS to'g'ri ishlayaptimi?</li>
                            <li><strong>DNS sozlamalari:</strong> Domain to'g'ri IP ga yo'naltirilganmi?</li>
                        </ol>
                        <p><strong>Vaqtincha yechim:</strong> Backend serverni localhost:8080 da ishga tushiring</p>
                    </div>
                    `
												: `
                    <p>Server ishlayotganligini tekshiring:</p>
                    <ul>
                        <li>Backend API (api.techdilnoza.uz) ishlaydimi?</li>
                        <li>Server xatoliklari logini tekshiring</li>
                        <li>MongoDB Atlas ulanishi bormi?</li>
                    </ul>
                    `
										}
                    <button onclick="loadMaterials()" class="btn">🔄 Qayta yuklash</button>
                    <button onclick="window.open('${API_BASE}/health', '_blank')" class="btn">🔧 Server holatini tekshirish</button>
                </div>
            `
		}
	}
}

// News yuklab olish - Enhanced version
async function loadNews() {
	try {
		debugLog('Loading news...')

		const res = await fetchWithFallback('/news', {
			method: 'GET',
			mode: 'cors',
			credentials: 'omit',
		})

		if (!res.ok) {
			throw new Error(`News API failed: ${res.status} ${res.statusText}`)
		}

		const news = await res.json()
		debugLog('News loaded:', news.length)

		const container = document.getElementById('newsContainer')
		if (!container) {
			debugLog('ERROR: newsContainer not found')
			return
		}

		container.innerHTML = ''

		if (news.length === 0) {
			container.innerHTML = `
                <div class="no-data glass">
                    <h3>📰 Yangiliklar topilmadi</h3>
                    <p>Hozircha yangiliklar qo'shilmagan.</p>
                </div>
            `
			return
		}

		// Show latest 3 news
		news.slice(0, 3).forEach((item, index) => {
			const newsCard = document.createElement('div')
			newsCard.className = 'news-card glass'

			// Safe date parsing
			let date = "Noma'lum sana"
			try {
				const dateObj = new Date(item.date || item.createdAt || new Date())
				if (!isNaN(dateObj.getTime())) {
					date = dateObj.toLocaleDateString('uz-UZ')
				}
			} catch (e) {
				debugLog('Date parsing error:', e)
			}

			// Safe content handling
			const title = item.title || 'Yangilik sarlavhasi'
			const content = item.content || "Yangilik matni yo'q"
			const author = item.author || 'Dilnoza Qodirova'

			newsCard.innerHTML = `
                <div class="news-content">
                    <h4>${title}</h4>
                    <p>${content}</p>
                    <div class="news-meta">
                        <span class="date">📅 ${date}</span>
                        <span class="author">👤 ${author}</span>
                    </div>
                </div>
            `
			container.appendChild(newsCard)
			debugLog(`News ${index + 1} added`)
		})

		debugLog(`✅ ${news.length} news items processed`)
	} catch (error) {
		debugLog('ERROR in loadNews:', error)

		const container = document.getElementById('newsContainer')
		if (container) {
			// Check if it's a CORS error
			const isCorsError =
				error.message.includes('Failed to fetch') ||
				error.message.includes('CORS') ||
				error.message.includes('blocked by CORS policy')

			container.innerHTML = `
                <div class="error-message glass">
                    <h3>⚠️ ${
											isCorsError
												? 'CORS Xatoligi - Yangiliklar'
												: 'Yangiliklar yuklanmadi'
										}</h3>
                    <p><strong>Xatolik:</strong> ${error.message}</p>
                    ${
											isCorsError
												? `
                    <p><strong>Sabab:</strong> Backend server bilan aloqa o'rnatilmadi (CORS)</p>
                    <p><strong>Yechim:</strong> Backend serverdagi CORS sozlamalarini tekshiring</p>
                    `
												: ''
										}
                    <button onclick="loadNews()" class="btn">🔄 Qayta yuklash</button>
                </div>
            `
		}
	}
}

// Set current year in footer
function setCurrentYear() {
	const yearElement = document.getElementById('year')
	if (yearElement) {
		yearElement.textContent = new Date().getFullYear()
	}
}

// Page load event - Enhanced
document.addEventListener('DOMContentLoaded', async function () {
	debugLog('DOM loaded, starting initialization...')

	// Set year first
	setCurrentYear()

	// Test API connectivity first
	const isAPIConnected = await testAPIConnectivity()

	if (!isAPIConnected) {
		showConnectionWarning()
		console.log('🔄 Using demo mode due to API connectivity issues')
	}

	// Load data with delays to see progress
	setTimeout(() => {
		debugLog('Loading materials...')
		loadMaterials()
	}, 100)

	setTimeout(() => {
		debugLog('Loading news...')
		loadNews()
	}, 200)

	// Make debug functions available globally
	window.debugMaterialDownload = debugMaterialDownload
	window.testDownload = function (materialId) {
		if (window.allMaterials) {
			const material = window.allMaterials.find(m => m._id === materialId)
			if (material) {
				console.log('🧪 Testing download for:', material.title)
				downloadMaterial(materialId, material.title, material.fileName)
			} else {
				console.error('Material not found:', materialId)
			}
		} else {
			console.error('Materials not loaded yet')
		}
	}

	// Test CORS function
	window.testCORS = async function () {
		console.group('🧪 CORS Test Results')

		try {
			console.log('Testing main API:', API_BASE)
			const mainResponse = await fetch(`${API_BASE}/health`)
			console.log('✅ Main API working:', mainResponse.status)
		} catch (error) {
			console.log('❌ Main API failed:', error.message)
		}

		try {
			console.log('Testing fallback API:', FALLBACK_API_BASE)
			const fallbackResponse = await fetch(`${FALLBACK_API_BASE}/health`)
			console.log('✅ Fallback API working:', fallbackResponse.status)
		} catch (error) {
			console.log('❌ Fallback API failed:', error.message)
		}

		console.groupEnd()
	}

	debugLog('Initialization complete')
})

// Global error handler
window.addEventListener('error', function (e) {
	debugLog('Global error:', e.error)
})

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function (e) {
	debugLog('Unhandled promise rejection:', e.reason)
})

// Helper functions
function getSectionName(section) {
	const sections = {
		lectures: "📖 Ma'ruzalar",
		practicals: "✏️ Amaliy mashg'ulotlar",
		presentations: '📊 Taqdimotlar',
		books: "📚 Qo'llanma va kitoblar",
	}
	return sections[section] || section
}

function formatDate(dateString) {
	if (!dateString) return "Noma'lum sana"
	try {
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return "Noma'lum sana"
		return date.toLocaleDateString('uz-UZ', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	} catch (e) {
		return "Noma'lum sana"
	}
}

function trackDownload(materialId, title) {
	debugLog(`📥 Download started: ${title} (ID: ${materialId})`)

	// Show success message
	showNotification(`"${title}" fayli yuklab olinmoqda...`, 'success')
}

// Enhanced download function with better error handling
async function downloadMaterial(materialId, title, filename = 'file') {
	try {
		debugLog(`📥 Starting download for material: ${title} (ID: ${materialId})`)

		// Debug material info
		if (window.allMaterials && window.allMaterials.length > 0) {
			debugMaterialDownload(materialId, window.allMaterials)
		}

		// Show loading notification
		showNotification(`"${title}" yuklab olinmoqda...`, 'info')

		// First, get the material info to check if it exists and has files
		debugLog(`🔍 Checking material existence: ${materialId}`)

		const materialsResponse = await fetchWithFallback('/materials')
		if (!materialsResponse.ok) {
			throw new Error(`Materials API failed: ${materialsResponse.status}`)
		}

		const materials = await materialsResponse.json()
		const material = materials.find(m => m._id === materialId)

		if (!material) {
			throw new Error('Material topilmadi')
		}

		debugLog(`✅ Material found:`, {
			title: material.title,
			fileUrl: material.fileUrl,
			fileKey: material.fileKey,
			fileName: material.fileName,
		})

		if (!material.fileUrl && !material.fileKey) {
			throw new Error('Bu materialga fayl biriktirilmagan')
		}

		// Try multiple download methods
		let downloadSuccess = false

		// Method 1: Try the API download endpoint
		try {
			debugLog(`🔗 Method 1: API Download endpoint`)
			const downloadUrl = `${API_BASE}/materials/${materialId}/download`
			debugLog(`🔗 Download URL: ${downloadUrl}`)

			// Check if the download endpoint responds
			const downloadResponse = await fetch(downloadUrl, { method: 'HEAD' })

			if (downloadResponse.ok) {
				// If endpoint exists, use it
				const link = document.createElement('a')
				link.href = downloadUrl
				link.download = material.fileName || filename
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)

				downloadSuccess = true
				debugLog(`✅ API download successful`)
				trackDownload(materialId, title)
				showNotification(`"${title}" API orqali yuklab olindi!`, 'success')
			} else {
				debugLog(
					`❌ API download endpoint not available: ${downloadResponse.status}`
				)
			}
		} catch (apiError) {
			debugLog(`❌ API download failed:`, apiError.message)
		}

		// Method 2: Direct S3 URL fallback
		if (!downloadSuccess) {
			debugLog(`🔗 Method 2: Direct S3 fallback`)

			let directUrl = null

			if (material.fileUrl && !material.fileUrl.includes('placeholder')) {
				directUrl = material.fileUrl
			} else if (material.fileKey) {
				directUrl = `https://s3.twcstorage.ru/e008923b-dbcf87a4-7047-45d8-8a51-89a9793149a6/${material.fileKey}`
			}

			if (directUrl) {
				// Ensure HTTPS
				if (
					!directUrl.startsWith('http://') &&
					!directUrl.startsWith('https://')
				) {
					directUrl = `https://${directUrl}`
				}

				debugLog(`🔗 Direct S3 URL: ${directUrl}`)

				const link = document.createElement('a')
				link.href = directUrl
				link.download = material.fileName || filename
				link.target = '_blank' // Open in new tab for S3 direct links
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)

				downloadSuccess = true
				debugLog(`✅ S3 direct download successful`)
				trackDownload(materialId, title)
				showNotification(`"${title}" S3 orqali yuklab olindi!`, 'success')
			}
		}

		// Method 3: Alternative download endpoint
		if (!downloadSuccess) {
			debugLog(`🔗 Method 3: Alternative download endpoint`)

			try {
				const altDownloadUrl = `${API_BASE}/materials/${materialId}/download-redirect`
				debugLog(`🔗 Alternative URL: ${altDownloadUrl}`)

				const link = document.createElement('a')
				link.href = altDownloadUrl
				link.download = material.fileName || filename
				link.target = '_blank'
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)

				downloadSuccess = true
				debugLog(`✅ Alternative download successful`)
				trackDownload(materialId, title)
				showNotification(
					`"${title}" muqobil usul orqali yuklab olindi!`,
					'success'
				)
			} catch (altError) {
				debugLog(`❌ Alternative download failed:`, altError.message)
			}
		}

		if (!downloadSuccess) {
			throw new Error('Barcha yuklab olish usullari ishlamadi')
		}
	} catch (error) {
		debugLog(`❌ Final download error for ${title}:`, error)
		showNotification(`Yuklab olishda xatolik: ${error.message}`, 'error')
	}
}

// Alternative download function using fetch (for better error handling)
async function downloadMaterialAdvanced(materialId, title, filename = 'file') {
	try {
		debugLog(`📥 Advanced download for material: ${title} (ID: ${materialId})`)

		showNotification(`"${title}" yuklab olinmoqda...`, 'info')

		const downloadUrl = `${API_BASE}/materials/${materialId}/download`

		// Fetch the file
		const response = await fetch(downloadUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/octet-stream',
			},
		})

		if (!response.ok) {
			throw new Error(
				`Download failed: ${response.status} ${response.statusText}`
			)
		}

		// Get the blob
		const blob = await response.blob()

		// Get filename from Content-Disposition header if available
		const contentDisposition = response.headers.get('Content-Disposition')
		let downloadFilename = filename

		if (contentDisposition) {
			const filenameMatch = contentDisposition.match(
				/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
			)
			if (filenameMatch && filenameMatch[1]) {
				downloadFilename = filenameMatch[1].replace(/['"]/g, '')
			}
		}

		// Create download link
		const url = window.URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = downloadFilename

		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		// Clean up the blob URL
		window.URL.revokeObjectURL(url)

		trackDownload(materialId, title)

		debugLog(`✅ Advanced download completed for: ${title}`)
		showNotification(`"${title}" muvaffaqiyatli yuklab olindi!`, 'success')
	} catch (error) {
		debugLog(`❌ Advanced download error for ${title}:`, error)
		showNotification(`Yuklab olishda xatolik: ${error.message}`, 'error')
	}
}

function showNotification(message, type = 'info', duration = 3000) {
	const notification = document.createElement('div')
	notification.className = `notification notification-${type}`

	const icons = {
		success: '✅',
		error: '❌',
		warning: '⚠️',
		info: 'ℹ️',
	}

	notification.innerHTML = `
		<div class="notification-content">
			<span class="notification-icon">${icons[type] || icons.info}</span>
			<span class="notification-message">${message}</span>
		</div>
	`

	document.body.appendChild(notification)

	// Show animation
	setTimeout(() => notification.classList.add('show'), 10)

	// Auto remove after specified duration
	setTimeout(() => {
		notification.classList.remove('show')
		setTimeout(() => notification.remove(), 300)
	}, duration)
}

function updateMaterialsStats(materials) {
	const totalMaterials = materials.length
	const sections = [...new Set(materials.map(m => m.section))]
	const totalSections = sections.length

	// Update counters with animation
	animateCounter('totalMaterials', totalMaterials)
	animateCounter('totalSections', totalSections)

	debugLog(
		`📊 Stats updated: ${totalMaterials} materials, ${totalSections} sections`
	)
}

function animateCounter(elementId, targetValue) {
	const element = document.getElementById(elementId)
	if (!element) return

	const currentValue = parseInt(element.textContent) || 0
	const increment = targetValue > currentValue ? 1 : -1
	const stepTime = Math.abs(Math.floor(200 / (targetValue - currentValue))) || 1

	if (currentValue === targetValue) return

	const timer = setInterval(() => {
		const current = parseInt(element.textContent) || 0
		if (
			(increment > 0 && current >= targetValue) ||
			(increment < 0 && current <= targetValue)
		) {
			element.textContent = targetValue
			clearInterval(timer)
		} else {
			element.textContent = current + increment
		}
	}, stepTime)
}

// Unified API connectivity check – delegate to the more comprehensive frontend tester
async function testAPIConnectivity() {
	// testFrontendAPIConnectivity performs /health and fallback checks; reuse it to avoid duplicated logic
	try {
		return await testFrontendAPIConnectivity()
	} catch (e) {
		console.warn('⚠️ testAPIConnectivity wrapper error:', e && e.message)
		return false
	}
}

// Show API connection warning
function showConnectionWarning() {
	const existingWarning = document.querySelector('.api-warning')
	if (existingWarning) return

	const warning = document.createElement('div')
	warning.className = 'api-warning'
	warning.innerHTML = `
		⚠️ API ulanishida muammo bor. 
		Demo rejimida ishlayapmiz.
	`
	document.body.appendChild(warning)

	// Auto remove after 10 seconds
	setTimeout(() => {
		if (warning.parentNode) {
			warning.remove()
		}
	}, 10000)
}

// Global materials storage for filtering
let allMaterials = []

function filterMaterials() {
	const filterValue = document.getElementById('sectionFilter').value
	const container = document.getElementById('cardsContainer')

	if (!container || allMaterials.length === 0) {
		debugLog('No materials to filter')
		return
	}

	const filteredMaterials =
		filterValue === 'all'
			? allMaterials
			: allMaterials.filter(material => material.section === filterValue)

	debugLog(
		`Filtering materials: ${filterValue}, showing ${filteredMaterials.length}/${allMaterials.length}`
	)

	// Clear container
	container.innerHTML = ''

	if (filteredMaterials.length === 0) {
		container.innerHTML = `
			<div class="no-data glass">
				<h3>🔍 Bu bo'limda materiallar topilmadi</h3>
				<p>Tanlangan bo'lim: <strong>${getSectionName(filterValue)}</strong></p>
				<button class="btn" onclick="document.getElementById('sectionFilter').value='all'; filterMaterials();">Barcha materiallarni ko'rsatish</button>
			</div>
		`
		return
	}

	// Render filtered materials (similar to loadMaterials but without API call)
	filteredMaterials.forEach((item, index) => {
		// Generate proper S3 URLs - Enhanced logic (same as main function)
		let imageUrl = null

		if (
			item.imageUrl &&
			!item.imageUrl.includes('placeholder') &&
			!item.imageUrl.includes('example.com')
		) {
			imageUrl = item.imageUrl
		} else if (item.imageKey) {
			imageUrl = `https://s3.twcstorage.ru/e008923b-dbcf87a4-7047-45d8-8a51-89a9793149a6/${item.imageKey}`
		}

		let fileUrl = null

		if (
			item.fileUrl &&
			!item.fileUrl.includes('placeholder') &&
			!item.fileUrl.includes('example.com')
		) {
			fileUrl = item.fileUrl
		} else if (item.fileKey) {
			fileUrl = `https://s3.twcstorage.ru/e008923b-dbcf87a4-7047-45d8-8a51-89a9793149a6/${item.fileKey}`
		}

		// Create card element
		const card = document.createElement('div')
		card.className = 'card glass'

		// Create image section using direct S3 URL (same as admin)
		let imageSection = ''
		if (imageUrl) {
			console.log(
				`🔍 [FILTER DEBUG] Using imageUrl for ${item.title}:`,
				imageUrl
			)

			imageSection = `
				<div class="card-image">
					<img src="${imageUrl}" 
						 alt="${item.title}" 
						 style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px 12px 0 0;" 
						 onerror="
							console.error('❌ Filter image load failed for ${item.title}:', '${imageUrl}');
							this.parentElement.innerHTML='<div class=\\'no-image-placeholder\\' style=\\'height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 48px; border-radius: 12px 12px 0 0; flex-direction: column;\\'>📚<br><small style=\\'font-size: 12px; margin-top: 8px;\\'>Rasm yuklanmadi</small></div>';
						 "
						 onload="console.log('✅ Filter image loaded successfully for ${item.title}:', '${imageUrl}')">
				</div>`
		} else {
			imageSection = `
				<div class="no-image-placeholder" style="height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 48px; border-radius: 12px 12px 0 0; flex-direction: column;">
					📚
					<small style="font-size: 12px; margin-top: 8px;">Rasm qo'shilmagan</small>
				</div>`
		}

		card.innerHTML = `
			${imageSection}
			<div class="card-content">
				<div class="title"><h3>${item.title || 'Material'}</h3></div>
				<div class="desc">${item.description || item.desc || "Tavsif yo'q"}</div>
				<div class="card-meta">
					<span class="section-badge">${getSectionName(item.section)}</span>
					<span class="date">${formatDate(item.createdAt)}</span>
				</div>
				<div class="card-actions">
					${
						item.fileKey || item.fileUrl
							? `<button class="btn btn-download" onclick="console.log('🖱️ Filter download clicked for:', '${
									item.title
							  }', 'ID:', '${item._id}'); downloadMaterial('${
									item._id || 'unknown'
							  }', '${item.title}', '${item.fileName || 'file'}')">
							 📥 Yuklab olish
							 </button>`
							: '<button class="btn btn-disabled" disabled>📎 Fayl yuklanmagan</button>'
					}
				</div>
			</div>
		`

		container.appendChild(card)
	})

	// Update stats for filtered results
	updateMaterialsStats(filteredMaterials)

	showNotification(
		`${getSectionName(filterValue)} bo'limida ${
			filteredMaterials.length
		} ta material topildi`,
		'info'
	)
}
