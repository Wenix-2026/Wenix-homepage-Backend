<?php
// src/Controller/Admin/UserController.php

namespace App\Controller\Admin;

use App\Entity\Tenant\User;
use App\Entity\Tenant\AuditLog;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/users', name: 'admin_users_')]
#[IsGranted('ROLE_ADMIN')]
class UserController extends AbstractController
{
    private $em;

    public function __construct(
        ManagerRegistry $doctrine,
        private UserPasswordHasherInterface $passwordHasher,
    ) {
        // Tímto natvrdo řekneme, že chceme používat tenant připojení
        $this->em = $doctrine->getManager('tenant');
    }

    private function logAction(Request $request, string $action): void
    {
        $log = new AuditLog();
        $user = $this->getUser();
        $log->setUserEmail($user ? $user->getUserIdentifier() : 'Neznámý');
        $log->setAction($action);
        $log->setIpAddress($request->getClientIp());

        $this->em->persist($log);
        $this->em->flush();
    }

    #[Route('/', name: 'index')]
    public function index(): Response
    {
        $users = $this->em->getRepository(User::class)->findBy([], ['id' => 'DESC']);

        // Pokud je tabulka v SQLite úplně prázdná, podstrčíme pro test do pole aktuálně přihlášeného uživatele
        if (empty($users) && $this->getUser()) {
            $users = [$this->getUser()];
        }

        return $this->render('admin/users/index.html.twig', [
            'users' => $users,
            'error' => null
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request): Response
    {
        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('user_new', $request->get('_csrf_token'))) {
                $this->addFlash('error', 'Neplatný CSRF token.');
                return $this->redirect('/admin/users/');
            } else {
                $email = $request->get('email');
                $existing = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);

                if ($existing) {
                    $this->addFlash('error', 'Uživatel s tímto emailem již existuje.');
                    return $this->redirect('/admin/users/');
                } elseif (strlen($request->get('password')) < 6) {
                    $this->addFlash('error', 'Heslo musí mít alespoň 6 znaků.');
                    return $this->redirect('/admin/users/');
                } else {
                    $user = new User();
                    $user->setEmail($email);
                    $user->setName($request->get('name'));
                    $user->setRoles([$request->get('role', 'ROLE_USER')]);
                    $user->setPassword(
                        $this->passwordHasher->hashPassword($user, $request->get('password'))
                    );

                    if (method_exists($user, 'setActive')) {
                        $user->setActive(true);
                    }

                    $this->em->persist($user);
                    $this->em->flush();

                    $this->logAction($request, "Vytvořen nový uživatel: $email");

                    $this->addFlash('success', 'Uživatel byl úspěšně vytvořen.');
                    return $this->redirect('/admin/users/');
                }
            }
        }

        return $this->redirect('/admin/users/');
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(int $id, Request $request): Response
    {
        $user = $this->em->getRepository(User::class)->find($id);
        if (!$user) throw $this->createNotFoundException();

        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('user_edit_' . $id, $request->get('_csrf_token'))) {
                $this->addFlash('error', 'Neplatný CSRF token.');
                return $this->redirect('/admin/users/');
            } else {
                $user->setEmail($request->get('email'));
                $user->setName($request->get('name'));
                $user->setRoles([$request->get('role', 'ROLE_USER')]);

                $errorHappened = false;
                if ($newPassword = $request->get('password')) {
                    if (strlen($newPassword) < 6) {
                        $this->addFlash('error', 'Heslo musí mít alespoň 6 znaků.');
                        $errorHappened = true;
                    } else {
                        $user->setPassword(
                            $this->passwordHasher->hashPassword($user, $newPassword)
                        );
                    }
                }

                if (!$errorHappened) {
                    $this->em->flush();
                    $this->logAction($request, "Upraven uživatel: {$user->getEmail()}");
                    $this->addFlash('success', 'Uživatel byl upraven.');
                }

                return $this->redirect('/admin/users/');
            }
        }

        return $this->redirect('/admin/users/');
    }

    #[Route('/{id}/delete', name: 'delete', methods: ['POST'])]
    public function delete(int $id, Request $request): Response
    {
        if (!$this->isCsrfTokenValid('user_delete_' . $id, $request->get('_csrf_token'))) {
            $this->addFlash('error', 'Neplatný CSRF token.');
            return $this->redirect('/admin/users/');
        }

        $sudoPassword = $request->get('sudo_password');
        if (!$sudoPassword || !$this->passwordHasher->isPasswordValid($this->getUser(), $sudoPassword)) {
            $this->addFlash('error', 'Neplatné heslo administrátora. Uživatel nebyl smazán.');
            return $this->redirect('/admin/users/');
        }

        $user = $this->em->getRepository(User::class)->find($id);
        if (!$user) throw $this->createNotFoundException();

        if ($user->getUserIdentifier() === $this->getUser()->getUserIdentifier()) {
            $this->addFlash('error', 'Nemůžeš smazat vlastní účet.');
            return $this->redirect('/admin/users/');
        }

        $email = $user->getEmail();
        $this->em->remove($user);
        $this->em->flush();

        $this->logAction($request, "Smazán uživatel: $email");

        $this->addFlash('success', 'Uživatel byl smazán.');
        return $this->redirect('/admin/users/');
    }

    #[Route('/{id}/toggle', name: 'toggle', methods: ['POST'])]
    public function toggle(int $id, Request $request): Response
    {
        if (!$this->isCsrfTokenValid('user_toggle_' . $id, $request->get('_csrf_token'))) {
            $this->addFlash('error', 'Neplatný CSRF token.');
            return $this->redirect('/admin/users/');
        }

        $user = $this->em->getRepository(User::class)->find($id);
        if (!$user) throw $this->createNotFoundException();

        $user->setActive(!$user->isActive());
        $this->em->flush();

        $statusText = $user->isActive() ? 'aktivní' : 'neaktivní';
        $this->logAction($request, "Změněn stav uživatele {$user->getEmail()} na $statusText");

        $statusFlash = $user->isActive() ? 'aktivován' : 'deaktivován';
        $this->addFlash('success', "Uživatel byl $statusFlash.");
        return $this->redirect('/admin/users/');
    }
}
