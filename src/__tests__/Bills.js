/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { formatDate, formatStatus } from "../app/format.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    // Initialisation/simulation de la connexion de type "Employé"
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))

    const billsContainerFunction = (store, onNavigate) => {
      return new Bills({
        document,
        onNavigate: onNavigate,
        store: store,
        localStorage: window.localStorage,
      });
    }

    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      document.body.innerHTML = BillsUI({ data: bills })
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })

      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on the eye icon", () => {
      test("Then it should open a popup displaying the bill file", () => {
        // Je simule la page "Mes notes de frais" avec une seule note de frais
        document.body.innerHTML = BillsUI({ data: [bills[0]] })
        // Je récupère mon container pour pouvoir accéder aux fonctions
        const billsContainer = billsContainerFunction(null, null)
  
        // Mock la fonction de gestion de modale normalement définie par BootstrapJS 
        $.fn.modal = jest.fn()

        // Je récupère l'icône et la fonction qui gère le click de l'icône
        const eyeIcon = screen.getByTestId("icon-eye")
        const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(eyeIcon))
        // Je l'ajoute sur l'icône et simule le click sur l'icône
        eyeIcon.addEventListener("click", handleClickIconEye) 
        userEvent.click(eyeIcon)
        // Je vérifie que le click a bien été simulé
        expect(handleClickIconEye).toHaveBeenCalled()
  
        // Je récupère la modale et vérifie que la modale a bien été trouvée
        const modale = screen.getByTestId("modaleFileEmployee")
        expect(modale).toBeTruthy()
      })
    })
  
    describe("When I click on the new bill button", () => {
      test("Then it should open a new form", async () => {   
        // Je simule la page "Mes notes de frais"
        document.body.innerHTML = BillsUI({ data: bills })
        // Je récupère mon container pour pouvoir accéder aux fonctions
        const onNavigate = (path) => document.body.innerHTML = ROUTES({ pathname: path })
        const billsContainer = billsContainerFunction(null, onNavigate)
  
        // Je récupère mon bouton et la fonction qui gère le click
        const newBillButton = screen.getByTestId('btn-new-bill')
        const handleClick = jest.fn(() => billsContainer.handleClickNewBill())
        // Je l'ajoute sur le bouton et simule le click
        newBillButton.addEventListener('click', handleClick)
        userEvent.click(newBillButton)
        // Je vérifie que le click a bien été simulé
        expect(handleClick).toHaveBeenCalled()
  
        // Je récupère le formulaire de la nouvelle page et vérifie qu'il a bien été trouvé
        const form = screen.getByTestId("form-new-bill")
        expect(form).toBeTruthy()     
      })
    })

    // Test d'intégration GET Bills
    test("Then bills should be fetch from the mock API", async () => {
      document.body.innerHTML = BillsUI({ data: bills })

      const billsContainer = billsContainerFunction(mockStore, window.onNavigate, window.localStorage)
        
      const spyGetList = jest.spyOn(billsContainer, "getBills")
      const data = await billsContainer.getBills()
      const mockBills = await mockStore.bills().list()

      expect(spyGetList).toHaveBeenCalled()

      expect(data[0].date).toEqual(formatDate(mockBills[0].date))
      expect(data[0].status).toEqual(formatStatus(mockBills[0].status))
    })

  })
})

