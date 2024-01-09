import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css";

const useNotification = () => {
	const showErrorNotification = (message: string, id: any) => {
		if (!toast.isActive(id)) {
			toast.error(message, {
				position: toast.POSITION.TOP_RIGHT,
				autoClose: 2000,
			})
		}
	}

	const showWarningNotification = (message: string, id: any) => {
		if (!toast.isActive(id)) {
			toast.warning(message, {
				position: toast.POSITION.TOP_RIGHT,
				autoClose: 2000,
			})
		}
	}

	const showSuccessNotification = (message: string, id: any) => {
		if (!toast.isActive(id)) {
			toast.success(message, {
				position: toast.POSITION.TOP_RIGHT,
				autoClose: 2000,
			})
		}
	}

	return {
		showErrorNotification,
		showSuccessNotification,
		showWarningNotification,
	}
}
export default useNotification
