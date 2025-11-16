// Enhanced API base URL with debug
const API_BASE = 'https://api.techdilnoza.uz/api'

// Debug function
function debugLog(message, data = null) {
	console.log(`🔍 [DEBUG] ${message}`, data || '')
}

// Materials yuklab olish - Enhanced version
async function loadMaterials() {
	try {
		debugLog('Starting loadMaterials function')
		debugLog('API URL:', `${API_BASE}/materials`)
		debugLog('Current origin:', window.location.origin)

		// Test server connection first
		debugLog('Testing server connection...')
		const healthResponse = await fetch(`${API_BASE}/health`)
		if (!healthResponse.ok) {
			throw new Error(`Server not responding: ${healthResponse.status}`)
		}

		const healthData = await healthResponse.json()
		debugLog('Server health check passed:', healthData)

		// Now fetch materials
		debugLog('Fetching materials...')
		const res = await fetch(`${API_BASE}/materials`, {
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
				imageUrl = `https://s3.twcstorage.ru/3dac1c3b-5d899f73-21c9-4b9c-8b6a-8d9ce272565b/${item.imageKey}`
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
				fileUrl = `https://s3.twcstorage.ru/3dac1c3b-5d899f73-21c9-4b9c-8b6a-8d9ce272565b/${item.fileKey}`
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
														? `<button class="btn btn-download" onclick="downloadMaterial('${
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
			container.innerHTML = `
                <div class="error-message glass">
                    <h3>⚠️ Xatolik yuz berdi</h3>
                    <p><strong>Xatolik:</strong> ${error.message}</p>
                    <p>Server ishlayotganligini tekshiring:</p>
                    <ul>
                        <li>Backend API (api.techdilnoza.uz) ishlaydimi?</li>
                        <li>CORS to'g'ri sozlangandi?</li>
                        <li>MongoDB Atlas ulanishi bormi?</li>
                    </ul>
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

		const res = await fetch(`${API_BASE}/news`, {
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
			container.innerHTML = `
                <div class="error-message glass">
                    <h3>⚠️ Yangiliklar yuklanmadi</h3>
                    <p>Xatolik: ${error.message}</p>
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
document.addEventListener('DOMContentLoaded', function () {
	debugLog('DOM loaded, starting initialization...')

	// Set year first
	setCurrentYear()

	// Load data with delays to see progress
	setTimeout(() => {
		debugLog('Loading materials...')
		loadMaterials()
	}, 100)

	setTimeout(() => {
		debugLog('Loading news...')
		loadNews()
	}, 200)

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

// New proper download function
async function downloadMaterial(materialId, title, filename = 'file') {
	try {
		debugLog(`📥 Starting download for material: ${title} (ID: ${materialId})`)

		// Show loading notification
		showNotification(`"${title}" yuklab olinmoqda...`, 'info')

		// Method 1: Try the streaming download endpoint
		let downloadUrl = `${API_BASE}/materials/${materialId}/download`
		debugLog(`🔗 Download URL: ${downloadUrl}`)

		// Try download with fallback system
		const tryDownload = (url, method = 'main') => {
			debugLog(`🔗 Attempting ${method} download: ${url}`)

			const link = document.createElement('a')
			link.href = url
			link.download = filename
			// target="_blank" olib tashlandi - shu sahifada qolish uchun

			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)

			trackDownload(materialId, title)
			debugLog(`✅ ${method} download initiated for: ${title}`)

			setTimeout(() => {
				showNotification(
					`"${title}" yuklab olindi (${method} usul)!`,
					'success'
				)
			}, 1000)
		}

		// Method 1: Main download endpoint
		tryDownload(downloadUrl, 'main')
	} catch (error) {
		debugLog(`❌ Download error for ${title}:`, error)

		// Last resort: try direct S3 URL
		try {
			debugLog(`🔄 Trying direct S3 fallback...`)

			const materialsResponse = await fetch(`${API_BASE}/materials`)
			if (materialsResponse.ok) {
				const materials = await materialsResponse.json()
				const material = materials.find(m => m._id === materialId)

				if (material && (material.fileUrl || material.fileKey)) {
					let directUrl = material.fileUrl
					if (!directUrl && material.fileKey) {
						directUrl = `https://s3.twcstorage.ru/3dac1c3b-5d899f73-21c9-4b9c-8b6a-8d9ce272565b/${material.fileKey}`
					}
					if (directUrl && !directUrl.startsWith('http')) {
						directUrl = `https://${directUrl}`
					}

					debugLog(`🔗 Direct S3 URL: ${directUrl}`)

					// Create download link for S3 fallback (without _blank)
					const s3Link = document.createElement('a')
					s3Link.href = directUrl
					s3Link.download = filename
					document.body.appendChild(s3Link)
					s3Link.click()
					document.body.removeChild(s3Link)

					showNotification(`Direct S3 orqali yuklab olinmoqda...`, 'info')
					return
				}
			}
		} catch (fallbackError) {
			debugLog(`❌ S3 fallback failed: ${fallbackError.message}`)
		}

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

function showNotification(message, type = 'info') {
	const notification = document.createElement('div')
	notification.className = `notification notification-${type}`
	notification.innerHTML = `
		<div class="notification-content">
			<span class="notification-icon">${
				type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
			}</span>
			<span class="notification-message">${message}</span>
		</div>
	`

	document.body.appendChild(notification)

	// Show animation
	setTimeout(() => notification.classList.add('show'), 10)

	// Auto remove after 3 seconds
	setTimeout(() => {
		notification.classList.remove('show')
		setTimeout(() => notification.remove(), 300)
	}, 3000)
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
			imageUrl = `https://s3.twcstorage.ru/3dac1c3b-5d899f73-21c9-4b9c-8b6a-8d9ce272565b/${item.imageKey}`
		}

		let fileUrl = null

		if (
			item.fileUrl &&
			!item.fileUrl.includes('placeholder') &&
			!item.fileUrl.includes('example.com')
		) {
			fileUrl = item.fileUrl
		} else if (item.fileKey) {
			fileUrl = `https://s3.twcstorage.ru/3dac1c3b-5d899f73-21c9-4b9c-8b6a-8d9ce272565b/${item.fileKey}`
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
							? `<button class="btn btn-download" onclick="downloadMaterial('${
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
