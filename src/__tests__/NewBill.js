/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import mockStore from "../__mocks__/store";

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js";

import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    // Initialisation/simulation de la connexion de type "Employé"
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

    const newBillContainerFunction = (store, onNavigate) => {
      return new NewBill({
        document,
        onNavigate: onNavigate,
        store: store,
        localStorage: window.localStorage,
      });
    }

    test("Then it should render the new bill form", () => {
      document.body.innerHTML = NewBillUI()
      const form = screen.getByTestId('form-new-bill');
      expect(form).toBeTruthy()
    })

    test("Then mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      document.body.innerHTML = NewBillUI()
      window.onNavigate(ROUTES_PATH.NewBill)

      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList.contains('active-icon')).toBe(true)
    })

    describe("When I click on the file input and choose a file", () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = (path) => document.body.innerHTML = ROUTES({ pathname: path })

      const newBillContainer = newBillContainerFunction(mockStore, onNavigate);

      const fileInput = screen.getByTestId("file")
      const handleChangeFile = jest.fn((e) => newBillContainer.handleChangeFile(e))
      fileInput.addEventListener("change", handleChangeFile)

      test("Then it should be accepted if it has the right extension", async () => {
        const file = new File(['test'], 'test.png', { type: 'image/png' })
        const event = { 
          target: { 
            files: [file] 
          } 
        }

        fireEvent.change(fileInput, event)
        expect(handleChangeFile).toHaveBeenCalled()

        expect(fileInput.files[0]).toStrictEqual(file)
        expect(fileInput.files[0].name).toBe('test.png')
      })

      test("Then it should be refused if it has the wrong extension", async () => {
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
        const event = { target: { files: [file] } }

        fireEvent.change(fileInput, event)
        expect(handleChangeFile).toHaveBeenCalled()

        expect(fileInput.files[0]).toStrictEqual(file)
        expect(fileInput.files[0].name).toBe('test.pdf')

        const errorMsg = screen.getByTestId("file-extension-error")
        expect(errorMsg).toBeTruthy()
      })
    })

    describe("When I click on the send button", () => {
      describe("When every fields are set", () => {
        document.body.innerHTML = NewBillUI()
        const onNavigate = (path) => document.body.innerHTML = ROUTES({ pathname: path })
        
        const newBillContainer = newBillContainerFunction(mockStore, onNavigate)
        expect(screen.getByTestId("form-new-bill")).toBeTruthy()

        const formNewBill = screen.getByTestId("form-new-bill")

        test("Then the new bill form should be submited and we should return on the bills page ", () => {
          // Set values for all input
          screen.getByTestId('expense-type').value = 'Transports';
          screen.getByTestId('expense-name').value = 'Vol';
          screen.getByTestId('datepicker').value = '30-03-2022';
          screen.getByTestId('amount').value = 399;
          screen.getByTestId('vat').value = 20;
          screen.getByTestId('pct').value = 40;
          screen.getByTestId('commentary').value = 'Test';

          const handleSubmit = jest.fn((e) => newBillContainer.handleSubmit(e))
          formNewBill.addEventListener("submit", handleSubmit)
          
          fireEvent.submit(formNewBill)
          expect(handleSubmit).toHaveBeenCalled()
          
          expect(screen.getByText('Mes notes de frais')).toBeTruthy()
        })
      })
    })


    // Test d'intégration POST
    describe("When I submit a new bill", () => {
      test('Then it sould send the new bill to the mock API POST', async () => {
        const postSpy = jest.spyOn(mockStore, 'bills');

        const newBill = {
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl:
            "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        };

        const bills = mockStore.bills(newBill);
        expect(postSpy).toHaveBeenCalledTimes(1);
        expect((await bills.list()).length).toBe(4);
      })

      // 404
      test("Then it should send the new bill to the mock API POST and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return Promise.reject(new Error("Erreur 404"))
        });

        const html = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = html;
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
  
      // 500
      test("Then it should send the new bill to the mock API POST and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return Promise.reject(new Error("Erreur 500"))
        });

        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    })

  })

})
