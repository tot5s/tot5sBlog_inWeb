import {db} from "../firebase"
import {
    doc, getDoc, setDoc
} from "firebase/firestore"


type AdminData = {
    nickname: string
    bio: string
    profileImageUrl: string
}


export async function getAdminData(): Promise<AdminData | null> {

    if (!db) {
        throw new Error('Firebase is not configured')
    }

    const adminDocRef = doc( db , "admin", "profile")

    try {
        const docSnap = await getDoc(adminDocRef)
        if (docSnap.exists()) {
            return docSnap.data() as AdminData
        } else {
            console.log("No such document!")
            return null
        }
    } catch (error) {
        console.error("Error getting admin data:", error)
        return null
    }
}

export async function updateAdminData(data: Partial<AdminData>): Promise<void> {
    if (!db) {
        throw new Error('Firebase is not configured')
    }
    
    const adminDocRef = doc(db, "admin", "profile")
    
    try {
        await setDoc(adminDocRef, data)
    } catch (error) {
        console.error("Error updating admin data:", error)
    }
}   