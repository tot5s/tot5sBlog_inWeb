
import { useAuth } from "../auth-context"


function AdminPage() {
  const { isAdmin, isReady } = useAuth()
  
  if (!isReady) {
    return <div>Loading...</div>
  }

  if (!isAdmin) {
    return <div>Access denied</div>
  }
  


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        // 파일 업로드 처리 로직 구현
        console.log('Selected file:', file)
      }
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const nickname = formData.get('nickname')
      const bio = formData.get('bio')
      
      // 닉네임과 바이오 업데이트 처리 로직 구현
      console.log('Nickname:', nickname)
      console.log('Bio:', bio)
    }
  return (
    <div className="h-[calc(100dvh-50px)]">
      <form onSubmit={handleSubmit} className="h-full bg-white p-5 sm:p-7">
        <div className="px-4 space-y-6">
        <div className="flex items-center justify-center my-5">
          <div className="bg-rose-50 w-30 h-30 rounded-full overflow-hidden">
            <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} />
            <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center w-full h-full text-gray-400">
              <img src="./profile.jpg" alt="" className='w-full h-full object-cover rounded-full'/>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#5d33322] mb-1">닉네임 변경</label>
          <input
            type="text"
             className="w-full border-b rounded-md border-[#dfc3ae] px-4 py-2 text-[#35170f] outline-none transition focus:ring-4 focus:ring-[rgba(191,106,67,0.18)]"
            placeholder="새 닉네임을 입력하세요"
            name="nickname"

          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5d33322] mb-1">바이오 변경</label>
          <textarea
            className="block px-4 py-2 w-full  border-b rounded-md text-[#35170f] border-[#dfc3ae] outline-none shadow-sm focus:border-[#bf6a43] focus:ring-4 focus:ring-[rgba(191,106,67,0.18)] sm:text-sm resize-none"
            placeholder="새 바이오를 입력하세요"
            rows={4}
            name="bio"
          />
        </div>
      </div>
        <div className="px-4 mt-6 text-center">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#bf6a43] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bf6a43] hover:bg-[#a85b36]"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  )
}


export default AdminPage