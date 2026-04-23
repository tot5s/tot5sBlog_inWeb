
import { useAuth } from "../auth-context"
import { storage } from "../firebase"
import { getAdminData, updateAdminData } from "../lib/admin"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"


function AdminPage() {
  const { isAdmin, isReady, user } = useAuth()
  const navigate = useNavigate()
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')

   useEffect(() => {
    const loadAdminData = async () => {
      try {
        const adminData = await getAdminData()
        if (adminData) {
          setProfileImageUrl(adminData.profileImageUrl)
          setNickname(adminData.nickname)
          setBio(adminData.bio)
        }
      } catch (error) {
        console.error("Error loading admin data:", error)
      }
    }

    void loadAdminData()
  }, [])


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if(!file || !user || !storage) {
        console.error("Invalid file or user data")
        return
      }

      if (file && user) {
        try {
          const storageRef = ref(storage, `admin/profile.jpg`)
          await uploadBytes(storageRef, file)
          const imageUrl = await getDownloadURL(storageRef)
          setProfileImageUrl(imageUrl)
          await updateAdminData({ profileImageUrl: imageUrl })
        } catch (error) {
          console.error("Error uploading file:", error)
        }
      }
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const nickname = formData.get('nickname') as string;
      const bio = formData.get('bio') as string;
    

      try {
        await updateAdminData({ nickname, bio, profileImageUrl })
        alert('프로필이 성공적으로 업데이트되었습니다.')  
      } catch (error) {
        console.error("Error updating admin data:", error)
        alert('프로필 업데이트 중 오류가 발생했습니다.')
      } finally {
        // event.currentTarget.reset()
        navigate('/')
      }
    }


     if (!isReady) {
    return <div>Loading...</div>
  }

  if (!isAdmin) {
    return <div>Access denied</div>
  }
  
    
  return (
    <div className="h-[calc(100dvh-50px)]">
      <form onSubmit={handleSubmit} className="h-full bg-white p-5 sm:p-7">
        <div className="px-4 space-y-6">
        <div className="flex items-center justify-center my-5">
          <div className="bg-rose-50 w-30 h-30 rounded-full overflow-hidden">
            <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} />
            <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center w-full h-full text-gray-400">
              <img src={profileImageUrl || "./profile.jpg"} alt="" className='w-full h-full object-cover rounded-full'/>
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
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5d33322] mb-1">바이오 변경</label>
          <textarea
            className="block px-4 py-2 w-full  border-b rounded-md text-[#35170f] border-[#dfc3ae] outline-none shadow-sm focus:border-[#bf6a43] focus:ring-4 focus:ring-[rgba(191,106,67,0.18)] sm:text-sm resize-none"
            placeholder="새 바이오를 입력하세요"
            rows={4}
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
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
