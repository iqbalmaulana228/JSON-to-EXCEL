import React, { useState, useCallback, useMemo } from 'react';
// Ikon dari lucide-react
import { UploadCloud, FileText, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Komponen utama aplikasi
function App() {
  const [jsonData, setJsonData] = useState(null); // State untuk menyimpan data JSON yang diurai
  const [fileName, setFileName] = useState(''); // State untuk menyimpan nama file yang diunggah
  const [error, setError] = useState(''); // State untuk pesan error
  const [isLoading, setIsLoading] = useState(false); // State untuk indikator loading
  const [uploadProgress, setUploadProgress] = useState(0); // State untuk progress bar unggahan

  // State untuk paginasi
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Jumlah baris per halaman

  // Memastikan pustaka XLSX dan PapaParse dimuat secara global melalui skrip eksternal
  // dan tersedia di objek window. Jika Anda menjalankan ini di luar lingkungan Canvas,
  // Anda mungkin perlu menambahkan tag <script> ke file HTML Anda untuk memuatnya.
  const XLSX = window.XLSX;
  const Papa = window.Papa;

  // Fungsi untuk meratakan objek JSON
  const flattenObject = (obj, parentKey = '', result = {}) => {
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          // Jika objek bersarang dan bukan array, rekursif
          flattenObject(obj[key], newKey, result);
        } else if (Array.isArray(obj[key])) {
          // Jika ini adalah array, coba meratakannya juga
          if (obj[key].length > 0 && typeof obj[key][0] === 'object' && obj[key][0] !== null) {
            // Jika array objek, perlakukan setiap objek sebagai baris baru
            // Untuk kesederhanaan, kita hanya akan meratakan level pertama dari array objek.
            // Jika Anda memerlukan perataan yang lebih dalam untuk array, logika ini perlu diperluas.
            obj[key].forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                    flattenObject(item, `${newKey}_${index}`, result); // Menambahkan indeks untuk menghindari duplikasi kunci
                } else {
                    result[newKey] = JSON.stringify(obj[key]); // Stringify array non-objek
                }
            });
          } else {
            result[newKey] = JSON.stringify(obj[key]); // Stringify array non-objek
          }
        } else {
          result[newKey] = obj[key]; // Simpan nilai primitif
        }
      }
    }
    return result;
  };

  // Fungsi untuk menangani unggahan file
  const handleFileUpload = useCallback((event) => {
    setError('');
    setJsonData(null); // Reset data JSON sebelumnya
    setFileName('');
    setUploadProgress(0); // Reset progress
    setCurrentPage(1); // Reset halaman ke 1 setiap kali file baru diunggah

    const file = event.target.files ? event.target.files[0] : event.dataTransfer.files[0];

    if (!file) {
      return;
    }

    // Periksa tipe file (JSON atau TXT)
    if (!['application/json', 'text/plain'].includes(file.type)) {
      setError('Tipe file tidak didukung. Mohon unggah file JSON atau TXT.');
      return;
    }

    setFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentLoaded = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percentLoaded);
      }
    };

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let parsedData;

        // Coba parsing sebagai JSON
        try {
          parsedData = JSON.parse(content);
        } catch (jsonError) {
          // Jika gagal, coba parsing sebagai CSV (untuk TXT)
          if (file.type === 'text/plain' && Papa) { // Hanya coba PapaParse jika file adalah TXT
            const papaParsed = Papa.parse(content, { header: true, dynamicTyping: true });
            if (papaParsed.errors.length > 0) {
              console.error('PapaParse errors:', papaParsed.errors);
              throw new Error('Gagal mengurai file TXT sebagai CSV. Mungkin bukan format delimited.');
            }
            parsedData = papaParsed.data;
          } else {
            throw new Error('Gagal mengurai file. Pastikan formatnya JSON atau CSV yang valid.');
          }
        }

        // Akses data spesifik jika struktur seperti outputbupot_list.json
        let dataToProcess = parsedData;
        if (parsedData && parsedData.Payload && Array.isArray(parsedData.Payload.Data)) {
          dataToProcess = parsedData.Payload.Data;
        } else if (!Array.isArray(parsedData) && typeof parsedData === 'object') {
            // Jika objek tunggal, bungkus dalam array untuk konsistensi tabel
            dataToProcess = [parsedData];
        } else if (!Array.isArray(parsedData)) {
            // Jika bukan array dan bukan objek (misal: string, number)
            throw new Error('Struktur file tidak didukung. Mohon unggah array objek atau objek tunggal yang valid.');
        }

        // Meratakan setiap objek dalam array dataToProcess
        const flattenedData = dataToProcess.map(item => flattenObject(item));

        if (flattenedData.length === 0) {
            throw new Error('Tidak ada data yang dapat diproses dalam file yang diunggah.');
        }

        setJsonData(flattenedData);
        setUploadProgress(100); // Pastikan progress 100% setelah selesai
      } catch (err) {
        setError(err.message || 'Gagal memproses file. Pastikan formatnya benar.');
        console.error('Error processing file:', err);
        setJsonData(null); // Clear any partial data
      } finally {
        setIsLoading(false);
      }
    };

    // Memulai membaca file
    reader.readAsText(file);
  }, []);

  // Fungsi untuk menangani drop file
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    handleFileUpload(event);
  }, [handleFileUpload]);

  // Fungsi untuk mencegah default drag over
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Fungsi untuk mengunduh file Excel
  const downloadExcel = useCallback(() => {
    if (!jsonData || jsonData.length === 0) {
      setError('Tidak ada data untuk diunduh.');
      return;
    }

    // Periksa apakah XLSX tersedia secara global
    if (!XLSX) {
      setError('Pustaka Excel tidak dimuat. Mohon refresh halaman.');
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      // Menggunakan nama file asli, ganti ekstensi menjadi .xlsx
      XLSX.writeFile(workbook, `${fileName.split('.').slice(0, -1).join('.') || 'data'}.xlsx`);
    } catch (err) {
      setError('Gagal mengonversi ke Excel. Silakan coba lagi.');
      console.error('Error exporting to Excel:', err);
    }
  }, [jsonData, fileName, XLSX]);

  // Fungsi untuk mengunduh file CSV
  const downloadCsv = useCallback(() => {
    if (!jsonData || jsonData.length === 0) {
      setError('Tidak ada data untuk diunduh.');
      return;
    }

    // Periksa apakah Papa tersedia secara global
    if (!Papa) {
        setError('Pustaka CSV tidak dimuat. Mohon refresh halaman.');
        return;
    }

    try {
      const csv = Papa.unparse(jsonData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      // Menggunakan nama file asli, ganti ekstensi menjadi .csv
      link.setAttribute('download', `${fileName.split('.').slice(0, -1).join('.') || 'data'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Gagal mengonversi ke CSV. Silakan coba lagi.');
      console.error('Error exporting to CSV:', err);
    }
  }, [jsonData, fileName, Papa]);

  // Menghitung data yang akan ditampilkan di halaman saat ini
  const currentTableData = useMemo(() => {
    if (!jsonData) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return jsonData.slice(startIndex, endIndex);
  }, [jsonData, currentPage, itemsPerPage]);

  // Menghitung jumlah total halaman
  const totalPages = useMemo(() => {
    if (!jsonData) return 0;
    return Math.ceil(jsonData.length / itemsPerPage);
  }, [jsonData, itemsPerPage]);

  // Fungsi untuk mengubah halaman
  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Fungsi untuk merender tabel pratinjau
  const renderTable = () => {
    if (!currentTableData || currentTableData.length === 0) {
      return <p className="text-center text-gray-500">Tidak ada data untuk ditampilkan.</p>;
    }

    // Ambil semua kunci unik dari semua objek untuk header
    const allKeys = new Set();
    // Penting: ambil kunci dari seluruh jsonData, bukan hanya currentTableData,
    // untuk memastikan semua kolom ada di header
    jsonData.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    const headers = Array.from(allKeys);

    return (
      <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {/* Tampilkan data, jika objek atau array stringify, jika tidak ada tampilkan string kosong */}
                    {row[header] !== undefined && row[header] !== null
                      ? typeof row[header] === 'object' && !Array.isArray(row[header])
                        ? JSON.stringify(row[header])
                        : Array.isArray(row[header])
                          ? JSON.stringify(row[header])
                          : row[header]
                      : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans antialiased">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl w-full">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-6">
          Konversi JSON/TXT ke Excel/CSV Online
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Unggah file JSON atau TXT Anda, pratinjau data, dan unduh dalam format Excel atau CSV.
        </p>

        {/* Area Unggah File */}
        {!jsonData && (
          <div
            className="border-2 border-dashed border-blue-400 rounded-lg p-12 text-center cursor-pointer hover:border-blue-600 transition-colors duration-200"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-input').click()}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-4 text-blue-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span>Mengurai file... {uploadProgress}%</span>
                {/* Loading Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <UploadCloud className="w-16 h-16 text-blue-500 mb-4" />
                <p className="text-lg text-gray-700 font-semibold">
                  Drag & drop file JSON/TXT di sini atau
                </p>
                <button
                  type="button"
                  className="mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                  onClick={() => document.getElementById('file-input').click()}
                >
                  Pilih File
                </button>
              </div>
            )}
            <input
              type="file"
              id="file-input"
              className="hidden"
              accept=".json,.txt"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Indikator File yang Dipilih */}
        {fileName && !jsonData && !error && !isLoading && (
          <div className="mt-6 text-center text-gray-600 flex items-center justify-center">
            <FileText className="w-5 h-5 mr-2 text-blue-500" />
            <span>File dipilih: {fileName}</span>
            {/* Opsi untuk membatalkan unggahan */}
            <button
              onClick={() => {
                setFileName('');
                setError('');
                setJsonData(null);
                setUploadProgress(0);
                setIsLoading(false);
              }}
              className="ml-4 p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Batalkan unggahan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Area Pesan Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mt-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError('')}>
              <X className="w-4 h-4" />
            </span>
          </div>
        )}

        {/* Halaman Pratinjau & Konversi */}
        {jsonData && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-500" />
              Pratinjau Data: {fileName}
            </h2>
            {renderTable()}

            {/* Kontrol Paginasi */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {/* Pagination with ellipsis */}
                {(() => {
                  const pages = [];
                  const maxPagesToShow = 5;
                  let startPage = Math.max(1, currentPage - 2);
                  let endPage = Math.min(totalPages, currentPage + 2);

                  if (currentPage <= 3) {
                    startPage = 1;
                    endPage = Math.min(totalPages, maxPagesToShow);
                  } else if (currentPage >= totalPages - 2) {
                    startPage = Math.max(1, totalPages - maxPagesToShow + 1);
                    endPage = totalPages;
                  }

                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          currentPage === 1
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } transition-colors duration-200`}
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span key="start-ellipsis" className="px-2 select-none">...</span>
                      );
                    }
                  }

                  for (let page = startPage; page <= endPage; page++) {
                    pages.push(
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } transition-colors duration-200`}
                      >
                        {page}
                      </button>
                    );
                  }

                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="end-ellipsis" className="px-2 select-none">...</span>
                      );
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          currentPage === totalPages
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } transition-colors duration-200`}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={downloadExcel}
                className="flex items-center px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
              >
                <Download className="w-5 h-5 mr-2" />
                Unduh Excel
              </button>
              <button
                onClick={downloadCsv}
                className="flex items-center px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
              >
                <Download className="w-5 h-5 mr-2" />
                Unduh CSV
              </button>
              <button
                onClick={() => {
                  setJsonData(null);
                  setFileName('');
                  setError('');
                  setUploadProgress(0);
                  setCurrentPage(1); // Reset halaman saat unggah ulang
                }}
                className="flex items-center px-6 py-3 bg-gray-300 text-gray-800 font-bold rounded-lg shadow-md hover:bg-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
              >
                <X className="w-5 h-5 mr-2" />
                Unggah Ulang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
